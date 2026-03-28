<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import InlineRestTimer from '../../../components/practice/InlineRestTimer.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';
	import PracticeFooter from '../../../components/practice/PracticeFooter.svelte';
	import PracticeSettings from '../../../components/practice/PracticeSettings.svelte';
	import PracticePauseBanner from '../../../components/practice/PracticePauseBanner.svelte';
	import StartPracticeOverlay from '../../../components/practice/StartPracticeOverlay.svelte';
	import WakeLockWarning from '../../../components/practice/WakeLockWarning.svelte';
	import AddMovementModal from '../../../components/practice/AddMovementModal.svelte';
	import { formatTime } from '$lib/utils/formatting';
	import { createAudioController } from '$lib/utils/audio';
	import { createWakeLockManager } from '$lib/utils/wakeLock';
	import { createCountdownTimer, createIntervalTimer, createActiveSetTimer } from '$lib/utils/timers';
	import { 
		generateSetKey, 
		calculateTotalSets, 
		findNextIncompleteSet, 
		isAllSetsComplete,
		countCompletedMovementSets 
	} from '$lib/utils/sets';
	import { scrollAndHighlightSet, scrollToElement } from '$lib/utils/scroll';

	let { data } = $props<{ data: PageData }>();

	// Extract data from page data
	let practiceId = $state(data.practice.id);
	let routineId = $state(data.practice.routineId);
	let settings = $state({
		autoPlay: data.practice.routine.autoAdvance ?? data.userPrefs?.autoAdvance ?? false,
		audioEnabled: data.practice.routine.audioEnabled ?? data.userPrefs?.audioEnabled ?? true,
		keepAwake: data.practice.routine.keepAwake ?? data.userPrefs?.keepAwake ?? true
	});
	let isReadOnly = $state(data.isReadOnly);
	let setOverrides = $state<Record<string, number>>(data.setOverrides || {});

	// UI State
	let hasStarted = $state(false);
	let showSettings = $state(false);
	let activeMovementIndex = $state(0);
	let showAddMovementModal = $state(false);
	let isPaused = $state(false);

	// Async operation states
	let isSavingSettings = $state(false);
	let settingsError = $state<string | null>(null);
	let isCompletingSet = $state(false);
	let isCompletingWorkout = $state(false);
	let isAdjustingSets = $state<Record<string, boolean>>({});
	let isReordering = $state<Record<string, boolean>>({});
	let isRemoving = $state<Record<string, boolean>>({});
	let isAddingMovement = $state(false);
	let notesSavingStates = $state<Record<string, boolean>>({});

	// Set tracking
	let completedSets = $state<Set<string>>(new Set());
	let skippedSets = $state<Set<string>>(new Set());
	let completedValues = $state<Record<string, number>>({});
	let movementNotes = $state<Record<string, string>>({});

	// Timer state
	let duration = $state(0);

	// Rest timer state
	let showRestTimer = $state(false);
	let restType = $state<'between-sets' | 'between-movements' | 'switch-sides'>('between-sets');
	let nextExerciseName = $state('');
	let restingMovementIndex = $state(-1);
	let activeRestSetNumber = $state<number | null>(null);
	let activeRestSide = $state<'left' | 'right' | null>(null);
	let restTimerValue = $state(0);
	let restDurationValue = $state(0);

	// Active set timer state
	let activeSetTimerValue = $state(0);
	let activeSetTimerDuration = $state(0);
	let activeSetTimerPaused = $state(false);
	let currentActiveSetKey = $state<string | null>(null);

	// Auto-play flags
	let isAutoCompletingSet = $state(false);
	let isAutoAdvancing = $state(false);

	// Utility instances
	let audio = $state(createAudioController(settings.audioEnabled));
	let wakeLockManager = $state(createWakeLockManager(settings.keepAwake));

	// Timer controllers
	let durationTimer: ReturnType<typeof createIntervalTimer> | null = null;
	let restTimer: ReturnType<typeof createCountdownTimer> | null = null;
	let activeSetTimer: ReturnType<typeof createActiveSetTimer> | null = null;

	// Derived values
	let totalSets = $derived(calculateTotalSets(data.allRoutineMovements, setOverrides));
	let completedSetsCount = $derived(completedSets.size + skippedSets.size);
	let allSetsComplete = $derived(isAllSetsComplete(data.allRoutineMovements, completedSets, skippedSets, setOverrides));
	let activeMovement = $derived(data.allRoutineMovements[activeMovementIndex]);
	let isInRestPeriod = $derived(showRestTimer);

	// Timeout refs
	let notesTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		// Initialize completed/skipped sets from practice data
		for (const pd of data.practice.practiceData) {
			const key = generateSetKey(pd.routineMovementId, pd.setNumber, pd.side);
			if (pd.status === 'skipped') {
				skippedSets.add(key);
			} else {
				completedSets.add(key);
				completedValues[key] = pd.value;
			}
		}
		completedSets = new Set(completedSets);
		skippedSets = new Set(skippedSets);

		// Auto-start if practice has already started (existing practice with data)
		if (data.practice.practiceData.length > 0) {
			hasStarted = true;
			startPractice(false);
		}

		// Initialize notes from movements
		for (const rm of data.allRoutineMovements) {
			if (rm.notes) {
				movementNotes[rm.id] = rm.notes;
			}
		}
	});

	onDestroy(() => {
		durationTimer?.stop();
		restTimer?.stop();
		activeSetTimer?.stop();
		wakeLockManager.release();
		if (notesTimeout) clearTimeout(notesTimeout);
	});

	// Update audio/wakeLock when settings change
	$effect(() => {
		audio.setEnabled(settings.audioEnabled);
	});

	$effect(() => {
		if (!hasStarted) return;
		if (settings.keepAwake) {
			wakeLockManager.request();
		} else {
			wakeLockManager.release();
		}
	});

	function startPractice(playStartSound = true) {
		// Request wake lock
		if (settings.keepAwake) {
			wakeLockManager.request();
		}

		// Start duration timer
		durationTimer = createIntervalTimer(() => {
			duration++;
		}, () => isPaused);
		durationTimer.start();

		// Start initial rest if auto-play is enabled
		if (settings.autoPlay && data.practice.routine.restBetweenMovements > 0) {
			const firstMovement = data.allRoutineMovements[0];
			startRestTimer(
				data.practice.routine.restBetweenMovements,
				'between-movements',
				firstMovement.movement.name
			);
		}

		// Play start sound
		if (playStartSound) {
			audio.play('setStart');
		}
	}

	function handleUserInteraction() {
		wakeLockManager.reRequestOnInteraction(audio);
	}

	// Auto-play: Check and start active set timer
	function checkAndStartActiveSetTimer() {
		if (!hasStarted || !settings.autoPlay || isReadOnly || isAutoCompletingSet || isAutoAdvancing || restTimer?.isRunning) {
			stopActiveSetTimer();
			return;
		}

		// Find the active set
		const nextSet = findNextIncompleteSet(data.allRoutineMovements, completedSets, skippedSets, setOverrides);
		if (!nextSet) {
			stopActiveSetTimer();
			currentActiveSetKey = null;
			return;
		}

		const rm = data.allRoutineMovements[nextSet.movementIndex];
		if (rm.target.type === 'time' && rm.target.value > 0) {
			const key = generateSetKey(rm.id, nextSet.setNumber, nextSet.side);
			
			if (currentActiveSetKey !== key) {
				audio.play('setStart');
				audio.playCountdown();
				
				activeSetTimer = createActiveSetTimer(
					rm.target.value,
					(elapsed, remaining) => {
						activeSetTimerValue = elapsed;
						activeSetTimerDuration = rm.target.value;
					},
					() => audio.playCountdown(),
					async () => {
						audio.play('setComplete');
						isAutoCompletingSet = true;
						await handleSetComplete({
							setNumber: nextSet.setNumber,
							side: nextSet.side,
							movementIndex: nextSet.movementIndex,
							value: rm.target.value,
							weight: rm.weight,
							rating: 0
						});
						isAutoCompletingSet = false;
						currentActiveSetKey = null;
					},
					() => isPaused || activeSetTimerPaused
				);
				activeSetTimer.start();
				currentActiveSetKey = key;
			}
		}
	}

	$effect(() => {
		checkAndStartActiveSetTimer();
	});

	function stopActiveSetTimer() {
		activeSetTimer?.stop();
		activeSetTimerValue = 0;
		activeSetTimerDuration = 0;
		activeSetTimerPaused = false;
	}

	function toggleActiveSetTimerPaused() {
		activeSetTimerPaused = !activeSetTimerPaused;
	}

	function resetActiveSetTimer() {
		if (activeSetTimer?.isRunning && activeSetTimerDuration > 0) {
			// Can't actually reset the timer, but we reset the UI state
			activeSetTimerValue = 0;
			activeSetTimerPaused = false;
		}
	}

	async function handleSetComplete(setData: any) {
		const { setNumber, side, movementIndex, skipped = false } = setData;

		isCompletingSet = true;
		stopActiveSetTimer();

		const rm = data.allRoutineMovements[movementIndex];

		// Create form data
		const formData = new FormData();
		formData.append('routineMovementId', rm.id);
		formData.append('setNumber', setNumber.toString());
		formData.append('value', setData.value.toString());
		formData.append('measurementType', rm.target.type);
		formData.append('status', skipped ? 'skipped' : 'completed');

		if (side) formData.append('side', side);
		if (setData.weight) {
			formData.append('weight', setData.weight.toString());
			formData.append('weightUnit', rm.weightUnit || 'kg');
		}
		if (setData.rating) formData.append('rating', setData.rating.toString());

		// Save to server
		const response = await fetch('?/completeSet', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const key = generateSetKey(rm.id, setNumber, side);
			if (skipped) {
				skippedSets.add(key);
				skippedSets = new Set(skippedSets);
			} else {
				completedSets.add(key);
				completedSets = new Set(completedSets);
				completedValues[key] = setData.value;
			}
			currentActiveSetKey = null;
			audio.play('setComplete');

			// Auto-play logic
			if (settings.autoPlay) {
				handleAutoPlay(rm, setNumber, side, movementIndex);
			}
		}

		isCompletingSet = false;
	}

	async function handleUncompleteSet(setData: any) {
		const { setNumber, side, routineMovementId } = setData;

		isCompletingSet = true;

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('setNumber', setNumber.toString());
		if (side) formData.append('side', side);

		const response = await fetch('?/uncompleteSet', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const key = generateSetKey(routineMovementId, setNumber, side);
			completedSets.delete(key);
			skippedSets.delete(key);
			delete completedValues[key];
			completedSets = new Set(completedSets);
			skippedSets = new Set(skippedSets);
			currentActiveSetKey = null;
			scrollToNextIncompleteSet();
		}

		isCompletingSet = false;
	}

	function handleAutoPlay(rm: any, setNumber: number, side: 'left' | 'right' | null, movementIndex: number) {
		isAutoAdvancing = true;

		// Check if this was a bilateral left side
		if (rm.isBilateral && side === 'left') {
			const nextSideKey = generateSetKey(rm.id, setNumber, 'right');
			if (!completedSets.has(nextSideKey) && !skippedSets.has(nextSideKey)) {
				if (rm.switchSidesDuration > 0) {
					startRestTimer(
						rm.switchSidesDuration,
						'switch-sides',
						rm.movement.name,
						movementIndex,
						setNumber,
						'left'
					);
					return;
				}
			}
		}

		// Calculate total sets for this movement
		const actualSets = setOverrides[rm.id] ?? rm.sets;
		const movementTotalSets = rm.isBilateral ? actualSets * 2 : actualSets;
		const movementCompletedSets = countCompletedMovementSets(rm.id, completedSets, skippedSets);

		// Check if all sets for this movement are complete
		if (movementCompletedSets < movementTotalSets) {
			// More sets remaining in this movement
			if (data.practice.routine.restBetweenSets > 0) {
				startRestTimer(
					data.practice.routine.restBetweenSets,
					'between-sets',
					rm.movement.name,
					movementIndex,
					setNumber
				);
			} else {
				scrollToNextIncompleteSet();
			}
		} else {
			// All sets complete, move to next movement
			if (activeMovementIndex < data.allRoutineMovements.length - 1) {
				if (data.practice.routine.restBetweenMovements > 0) {
					const nextMovement = data.allRoutineMovements[activeMovementIndex + 1];
					startRestTimer(
						data.practice.routine.restBetweenMovements,
						'between-movements',
						nextMovement.movement.name,
						movementIndex
					);
				} else {
					scrollToNextIncompleteSet();
				}
			}
		}

		isAutoAdvancing = false;
	}

	function startRestTimer(
		duration: number,
		type: 'between-sets' | 'between-movements' | 'switch-sides',
		nextName: string,
		movementIndex?: number,
		setNumber?: number,
		side?: 'left' | 'right' | null
	) {
		restDurationValue = duration;
		restType = type;
		nextExerciseName = nextName;
		showRestTimer = true;
		restingMovementIndex = movementIndex ?? -1;
		activeRestSetNumber = setNumber ?? null;
		activeRestSide = side ?? null;

		if (type === 'switch-sides') {
			audio.play('switchSides');
		} else {
			audio.play('restStart');
		}

		restTimer = createCountdownTimer(
			duration,
			(remaining, progress) => {
				restTimerValue = remaining;
				// Play countdown at 3 seconds remaining
				if (remaining === 3) {
					audio.playCountdown();
				}
			},
			() => {
				finishRest();
			},
			() => isPaused
		);
		restTimer.start();

		scrollToElement('active-rest-timer');
	}

	function finishRest() {
		restTimer?.stop();
		audio.play('restEnd');
		showRestTimer = false;
		restingMovementIndex = -1;
		activeRestSetNumber = null;
		activeRestSide = null;
		scrollToNextIncompleteSet();
	}

	function skipRest() {
		finishRest();
	}

	function scrollToNextIncompleteSet() {
		const nextSet = findNextIncompleteSet(data.allRoutineMovements, completedSets, skippedSets, setOverrides);
		
		if (nextSet) {
			activeMovementIndex = nextSet.movementIndex;
			scrollAndHighlightSet(nextSet.routineMovementId, nextSet.setNumber, nextSet.side);
			audio.play('setStart');
		} else {
			// If all complete, stay on last movement
			activeMovementIndex = data.allRoutineMovements.length - 1;
		}
	}

	function handleNotesChange(routineMovementId: string, notes: string) {
		movementNotes[routineMovementId] = notes;
		notesSavingStates[routineMovementId] = true;

		if (notesTimeout) clearTimeout(notesTimeout);

		notesTimeout = setTimeout(async () => {
			const formData = new FormData();
			formData.append('routineMovementId', routineMovementId);
			formData.append('notes', notes);

			await fetch('?/updateMovementNotes', {
				method: 'POST',
				body: formData
			});

			notesSavingStates[routineMovementId] = false;
		}, 1000);
	}

	async function handleSettingsSave(newSettings: typeof settings) {
		isSavingSettings = true;
		settingsError = null;

		try {
			const formData = new FormData();
			formData.append('autoPlay', newSettings.autoPlay.toString());
			formData.append('audioEnabled', newSettings.audioEnabled.toString());
			formData.append('keepAwake', newSettings.keepAwake.toString());
			formData.append('practiceId', practiceId);

			const response = await fetch('?/updatePracticeSettings', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				settings = newSettings;
				showSettings = false;
			} else {
				settingsError = 'Failed to save settings';
			}
		} catch {
			settingsError = 'Failed to save settings';
		} finally {
			isSavingSettings = false;
		}
	}

	async function handleAdjustSets(routineMovementId: string, direction: 'up' | 'down') {
		isAdjustingSets[routineMovementId] = true;

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('direction', direction);

		const response = await fetch('?/adjustSets', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const rm = data.allRoutineMovements.find((m: any) => m.id === routineMovementId);
			if (rm) {
				const current = setOverrides[routineMovementId] ?? rm.sets;
				setOverrides[routineMovementId] = direction === 'up' ? current + 1 : Math.max(1, current - 1);
			}
		} else {
			const errorData = await response.json();
			alert(errorData.error || 'Failed to adjust sets');
		}

		isAdjustingSets[routineMovementId] = false;
	}

	async function handleMoveMovement(routineMovementId: string, direction: 'up' | 'down') {
		isReordering[routineMovementId] = true;
		isPaused = true;

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('direction', direction);

		const response = await fetch('?/reorderMovement', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidate('app:practice');
			isReordering[routineMovementId] = false;
			
			requestAnimationFrame(() => {
				const element = document.getElementById(`movement-${routineMovementId}`);
				if (element) {
					element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				}
			});
		} else {
			isPaused = false;
			alert('Failed to reorder movement');
			isReordering[routineMovementId] = false;
		}
	}

	async function handleRemoveMovement(routineMovementId: string) {
		if (!confirm('Remove this movement from the routine?')) return;

		isRemoving[routineMovementId] = true;
		isPaused = true;

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);

		const response = await fetch('?/removeMovement', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidate('app:practice');
			isRemoving[routineMovementId] = false;
		} else {
			isPaused = false;
			alert('Failed to remove movement');
			isRemoving[routineMovementId] = false;
		}
	}

	async function handleAddMovement(movementId: string) {
		isAddingMovement = true;
		isPaused = true;

		const formData = new FormData();
		formData.append('movementId', movementId);

		const response = await fetch('?/addMovement', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidate('app:practice');
			isAddingMovement = false;
			showAddMovementModal = false;
		} else {
			isPaused = false;
			alert('Failed to add movement');
			isAddingMovement = false;
		}
	}

	function handleExit() {
		if (confirm('Exit practice? Your progress so far is saved.')) {
			if (isReadOnly) {
				goto(`/routine/${routineId}`);
			} else {
				goto('/');
			}
		}
	}

	async function handleCompleteWorkout() {
		if (!confirm('Complete workout?')) return;

		isCompletingWorkout = true;
		audio.play('practiceComplete');

		await fetch('?/completePractice', {
			method: 'POST',
			body: new FormData()
		});

		goto(`/practice/${practiceId}/summary`);
	}

	function togglePause() {
		isPaused = !isPaused;
	}

	async function handleSkipSet() {
		if (!settings.autoPlay) return;

		const nextSet = findNextIncompleteSet(data.allRoutineMovements, completedSets, skippedSets, setOverrides);
		if (nextSet) {
			const rm = data.allRoutineMovements[nextSet.movementIndex];
			await handleSetComplete({
				setNumber: nextSet.setNumber,
				side: nextSet.side,
				movementIndex: nextSet.movementIndex,
				value: 0,
				weight: rm.weight,
				rating: 0,
				skipped: true
			});
		}
	}
</script>

<svelte:head>
	<title>Practice - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	{#if !hasStarted && !isReadOnly}
		<StartPracticeOverlay
			routineName={data.practice.routine.name}
			totalSets={totalSets}
			settings={settings}
			equipment={data.equipment}
			onStart={() => {
				hasStarted = true;
				startPractice();
			}}
		/>
	{/if}

	<WakeLockWarning
		show={hasStarted}
		error={wakeLockManager.error}
		onFix={handleUserInteraction}
	/>

	<PracticeHeader
		routineName={data.practice.routine.name}
		{totalSets}
		completedSets={completedSetsCount}
		duration={duration}
		currentMovementIndex={activeMovementIndex}
		totalMovements={data.allRoutineMovements.length}
		isPreview={false}
		onExit={handleExit}
		onSettings={() => (showSettings = true)}
	/>

	<main class="pt-4 pb-32 px-4 max-w-4xl mx-auto">
		{#if hasStarted && settings.autoPlay && data.practice.routine.restBetweenMovements > 0}
			{@const isActive = showRestTimer && restType === 'between-movements' && restingMovementIndex === -1}
			{@const firstMovementCompleted = countCompletedMovementSets(data.allRoutineMovements[0].id, completedSets, skippedSets) > 0}
			<InlineRestTimer
				remainingTime={isActive ? restTimerValue : data.practice.routine.restBetweenMovements}
				totalDuration={data.practice.routine.restBetweenMovements}
				type="between-movements"
				nextExerciseName={data.allRoutineMovements[0].movement.name}
				onSkip={isActive ? skipRest : undefined}
				isActive={isActive}
				isCompleted={firstMovementCompleted}
				isPaused={isPaused}
			/>
		{/if}

		{#if data.allRoutineMovements.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400">No movements in this routine</p>
			</div>
		{:else if isReadOnly}
			<div class="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
				<p class="text-yellow-200">
					<strong>Read-only mode:</strong> This practice has already been completed and cannot be modified.
				</p>
			</div>
		{/if}

		{#each data.allRoutineMovements as rm, index (rm.id)}
			{@const isActive = index === activeMovementIndex && !isReadOnly && hasStarted}
			{@const movementPreviousStats = data.previousStatsMap[rm.id] || null}
			{@const isSavingNotes = notesSavingStates[rm.id]}

			<div id="movement-{rm.id}">
				<MovementBlock
					movementIndex={index}
					routineMovementId={rm.id}
					movementName={rm.movement.name}
					movementType={rm.movement.type}
					description={rm.movement.description}
					targetValue={rm.target.value}
					sets={setOverrides[rm.id] ?? rm.sets}
					isBilateral={rm.isBilateral}
					switchSidesDuration={rm.switchSidesDuration}
					weight={rm.weight}
					weightUnit={rm.weightUnit}
					timePerRep={rm.movement.timePerRep}
					notes={rm.notes || movementNotes[rm.id]}
					previousStats={movementPreviousStats}
					isActive={isActive}
					{completedSets}
					{skippedSets}
					{completedValues}
					activeSetTimer={activeSetTimerValue}
					activeSetTimerPaused={activeSetTimerPaused}
					onToggleTimerPaused={toggleActiveSetTimerPaused}
					onResetTimer={resetActiveSetTimer}
					{isSavingNotes}
					{isCompletingSet}
					onSetComplete={handleSetComplete}
					onNotesChange={(notes: string) => handleNotesChange(rm.id, notes)}
					onAdjustSets={(direction) => handleAdjustSets(rm.id, direction)}
				onUncompleteSet={handleUncompleteSet}
				isAdjustingSets={isAdjustingSets[rm.id]}
				onSkipSet={settings.autoPlay ? handleSkipSet : undefined}
					isInRestPeriod={isInRestPeriod}
					activeRestType={restingMovementIndex === index && restType !== 'between-movements' ? restType : null}
					activeRestSetNumber={restingMovementIndex === index ? activeRestSetNumber : null}
					activeRestSide={restingMovementIndex === index ? activeRestSide : null}
					restRemainingTime={restTimerValue}
					restBetweenSetsDuration={data.practice.routine.restBetweenSets}
					onSkipRest={skipRest}
					onMoveUp={() => handleMoveMovement(rm.id, 'up')}
					onMoveDown={() => handleMoveMovement(rm.id, 'down')}
					onRemove={() => handleRemoveMovement(rm.id)}
					isFirst={index === 0}
					isLast={index === data.allRoutineMovements.length - 1}
					isPaused={isPaused}
					onRepIncrement={() => audio.play('rep')}
				/>
			</div>

			{#if index < data.allRoutineMovements.length - 1}
				{@const isRestActive = showRestTimer && restType === 'between-movements' && restingMovementIndex === index}
				{@const currentMovementSets = rm.isBilateral ? (setOverrides[rm.id] ?? rm.sets) * 2 : (setOverrides[rm.id] ?? rm.sets)}
				{@const isCurrentMovementComplete = countCompletedMovementSets(rm.id, completedSets, skippedSets) >= currentMovementSets}
				{@const nextMovement = data.allRoutineMovements[index + 1]}
				{@const isNextMovementStarted = countCompletedMovementSets(nextMovement.id, completedSets, skippedSets) > 0}
				
				<InlineRestTimer
					remainingTime={isRestActive ? restTimerValue : data.practice.routine.restBetweenMovements}
					totalDuration={data.practice.routine.restBetweenMovements}
					type="between-movements"
					nextExerciseName={nextMovement.movement.name}
					onSkip={isRestActive ? skipRest : undefined}
					isActive={isRestActive}
					isCompleted={isNextMovementStarted}
					isPaused={isPaused}
				/>
			{/if}
		{/each}

		{#if !isReadOnly}
			<button
				onclick={() => showAddMovementModal = true}
				disabled={isPaused}
				class="w-full p-4 bg-gray-800/30 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800/30 disabled:hover:text-gray-400 disabled:hover:border-gray-600 transition-all flex items-center justify-center gap-2"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add Movement
			</button>
		{/if}
	</main>

	{#if !isReadOnly}
		<PracticeFooter
			completedSets={completedSetsCount}
			{totalSets}
			onCompleteWorkout={allSetsComplete ? handleCompleteWorkout : undefined}
			{isCompletingWorkout}
			onTogglePause={togglePause}
			{isPaused}
		/>
	{/if}

	<PracticePauseBanner
		show={isPaused}
		onResume={togglePause}
	/>

	<PracticeSettings
		show={showSettings}
		{settings}
		onSave={handleSettingsSave}
		onCancel={() => (showSettings = false)}
		isSaving={isSavingSettings}
		error={settingsError}
	/>

	<AddMovementModal
		isOpen={showAddMovementModal}
		isLoading={isAddingMovement}
		isPaused={isPaused}
		groupedMovements={data.groupedMovements}
		onAdd={handleAddMovement}
		onClose={() => showAddMovementModal = false}
	/>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
