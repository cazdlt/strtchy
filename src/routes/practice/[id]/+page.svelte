<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import InlineRestTimer from '../../../components/practice/InlineRestTimer.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';
	import PracticeFooter from '../../../components/practice/PracticeFooter.svelte';
	import PracticeSettings from '../../../components/practice/PracticeSettings.svelte';
	import { formatTime } from '$lib/utils/formatting';
	import { nanoid } from 'nanoid';

	let { data } = $props<{ data: PageData }>();

	// Practice session state
	let practiceId = $state(data.practice.id);
	let routineId = $state(data.practice.routineId);

	// Settings state
	let settings = $state({
		autoPlay: data.practice.routine.autoAdvance ?? data.userPrefs?.autoAdvance ?? false,
		audioEnabled: data.practice.routine.audioEnabled ?? data.userPrefs?.audioEnabled ?? true,
		keepAwake: data.practice.routine.keepAwake ?? data.userPrefs?.keepAwake ?? true
	});

	// Timer state
	let duration = $state(0);
	let durationInterval = $state<ReturnType<typeof setInterval> | null>(null);

	// Rest timer state
	let showRestTimer = $state(false);
	let restDuration = $state(0);
	let restTimer = $state(0);
	let restInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let restType = $state<'between-sets' | 'between-movements' | 'switch-sides'>('between-sets');
	let nextExerciseName = $state('');
	let restingMovementIndex = $state(-1);
	let activeRestSetNumber = $state<number | null>(null);
	let activeRestSide = $state<'left' | 'right' | null>(null);

	// Active set timer state (for timed exercises)
	let activeSetTimer = $state(0);
	let activeSetTimerDuration = $state(0);
	let activeSetTimerInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let activeSetTimerPaused = $state(false);

	// Practice data state
	let completedSets = $state<Set<string>>(new Set());
	let movementNotes = $state<Record<string, string>>({});
	let isAutoCompletingSet = $state(false);
	let currentActiveSetKey = $state<string | null>(null);
	let isAutoAdvancing = $state(false);
	let setOverrides = $state<Record<string, number>>(data.setOverrides || {});

	// UI state
	let showSettings = $state(false);
	let activeMovementIndex = $state(0);
	let isSavingSettings = $state(false);
	let settingsError = $state<string | null>(null);
	let isCompletingSet = $state(false);
	let isSavingNotes = $state(false);
	let isCompletingWorkout = $state(false);
	let isAdjustingSets = $state<Record<string, boolean>>({});

	// Audio context
	let audioContext = $state<AudioContext | null>(null);

	// Wake lock
	let wakeLock = $state<WakeLockSentinel | null>(null);

	// Read-only check
	let isReadOnly = $state(data.isReadOnly);

	onMount(() => {
		// Initialize completed sets from practice data
		for (const pd of data.practice.practiceData) {
			const key = `${pd.routineMovementId}-${pd.setNumber}-${pd.side || 'none'}`;
			completedSets.add(key);
		}
		completedSets = new Set(completedSets);

		// Start duration timer
		durationInterval = setInterval(() => {
			duration++;
		}, 1000);

		// Request wake lock
		if (settings.keepAwake && 'wakeLock' in navigator) {
			navigator.wakeLock.request('screen').then((lock) => {
				wakeLock = lock;
			}).catch((err) => {
				console.error('Wake lock error:', err);
			});
		}

		// Start initial rest if auto-play is enabled
		if (settings.autoPlay && data.practice.routine.restBetweenMovements > 0) {
			const firstMovement = data.allRoutineMovements[0];
			startRestTimer(
				data.practice.routine.restBetweenMovements,
				'between-movements',
				firstMovement.movement.name
			);
		}
	});

	onDestroy(() => {
		if (durationInterval) {
			clearInterval(durationInterval);
			durationInterval = null;
		}
		if (restInterval) {
			clearInterval(restInterval);
			restInterval = null;
		}
		if (activeSetTimerInterval) {
			clearInterval(activeSetTimerInterval);
			activeSetTimerInterval = null;
		}
		if (wakeLock) {
			wakeLock.release();
		}
	});

	const totalSets = $derived(
		data.allRoutineMovements.reduce((sum: number, rm: any) => {
			const sets = setOverrides[rm.id] ?? rm.sets;
			return sum + (rm.isBilateral ? sets * 2 : sets);
		}, 0)
	);

	const completedSetsCount = $derived(completedSets.size);

	const allSetsComplete = $derived(completedSetsCount >= totalSets);

	const activeMovement = $derived(data.allRoutineMovements[activeMovementIndex]);

	// Start timer for timed exercises when they become active (auto-play mode)
	function checkAndStartActiveSetTimer() {
		if (!settings.autoPlay || isReadOnly || isAutoCompletingSet || isAutoAdvancing || restInterval !== null) {
			stopActiveSetTimer();
			return;
		}

		// Find the active set
		for (let i = 0; i < data.allRoutineMovements.length; i++) {
			const rm = data.allRoutineMovements[i];
			if (i !== activeMovementIndex) continue;

			const sets = rm.isBilateral ? rm.sets * 2 : rm.sets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key)) {
					// This is the active set
					if (rm.target.type === 'time' && rm.target.value > 0) {
						// Only start/restart timer if active set changed
						if (currentActiveSetKey !== key) {
							startActiveSetTimer(rm.target.value, async () => {
								await handleSetComplete({
									setNumber: actualSetNumber,
									side,
									movementIndex: i,
									value: rm.target.value,
									weight: rm.weight,
									rating: 0
								});
								currentActiveSetKey = null;
							});
							currentActiveSetKey = key;
						}
					}
					return;
				}
			}
		}

		// No incomplete sets found
		stopActiveSetTimer();
		currentActiveSetKey = null;
	}

	$effect(() => {
		checkAndStartActiveSetTimer();
	});

	function playBeep() {
		if (!settings.audioEnabled) return;

		if (!audioContext && 'AudioContext' in window) {
			audioContext = new AudioContext();
		}

		if (!audioContext) return;

		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		oscillator.frequency.value = 800;
		oscillator.type = 'sine';
		gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.1);
	}

	function startActiveSetTimer(duration: number, onComplete: () => void) {
		activeSetTimerDuration = duration;
		activeSetTimer = duration;
		activeSetTimerPaused = false;

		if (activeSetTimerInterval) {
			clearInterval(activeSetTimerInterval);
		}

		activeSetTimerInterval = setInterval(async () => {
			if (!activeSetTimerPaused) {
				activeSetTimer--;
				if (activeSetTimer <= 0) {
					if (activeSetTimerInterval) {
						clearInterval(activeSetTimerInterval);
						activeSetTimerInterval = null;
					}
					playBeep();
					isAutoCompletingSet = true;
					await onComplete();
					isAutoCompletingSet = false;
				}
			}
		}, 1000);
	}

	function toggleActiveSetTimerPaused() {
		activeSetTimerPaused = !activeSetTimerPaused;
	}

	function stopActiveSetTimer() {
		if (activeSetTimerInterval) {
			clearInterval(activeSetTimerInterval);
			activeSetTimerInterval = null;
		}
		activeSetTimer = 0;
		activeSetTimerDuration = 0;
		activeSetTimerPaused = false;
	}

	async function handleSetComplete(setData: any) {
		const { setNumber, side, movementIndex } = setData;

		isCompletingSet = true;

		// Stop any running active set timer
		stopActiveSetTimer();

		// Find the routine movement
		const rm = data.allRoutineMovements[movementIndex];

		// Create form data
		const formData = new FormData();
		formData.append('routineMovementId', rm.id);
		formData.append('setNumber', setNumber.toString());
		formData.append('value', setData.value.toString());
		formData.append('measurementType', rm.target.type);

		if (side) {
			formData.append('side', side);
		}

		if (setData.weight) {
			formData.append('weight', setData.weight.toString());
			formData.append('weightUnit', rm.weightUnit || 'kg');
		}

		if (setData.rating) {
			formData.append('rating', setData.rating.toString());
		}

		// Save to server
		const response = await fetch('?/completeSet', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const key = `${rm.id}-${setNumber}-${side || 'none'}`;
			completedSets.add(key);
			completedSets = new Set(completedSets);
			currentActiveSetKey = null;

			playBeep();

			// Auto-play logic
			if (settings.autoPlay) {
				handleAutoPlay(rm, setNumber, side);
			}
		}

		isCompletingSet = false;
	}

	function handleAutoPlay(rm: any, setNumber: number, side: 'left' | 'right' | null) {
		// Find the movement index
		const movementIndex = data.allRoutineMovements.findIndex((m: any) => m.id === rm.id);

		// Check if this was a bilateral left side
		if (rm.isBilateral && side === 'left') {
			const nextSideKey = `${rm.id}-${setNumber}-right`;
			if (!completedSets.has(nextSideKey)) {
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
				} else {
					scrollToNextIncompleteSet();
					return;
				}
			}
		}

		// Calculate total sets for this movement
		const movementTotalSets = rm.isBilateral ? rm.sets * 2 : rm.sets;
		const movementCompletedSets = countCompletedMovementSets(rm.id, rm.isBilateral);

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
	}

	function countCompletedMovementSets(routineMovementId: string, isBilateral: boolean): number {
		let count = 0;
		for (const key of completedSets) {
			if (key.startsWith(`${routineMovementId}-`)) {
				count += 1;
			}
		}
		return count;
	}

	function scrollToRest() {
		setTimeout(() => {
			const element = document.getElementById('active-rest-timer');
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 100);
	}

	function startRestTimer(
		duration: number,
		type: 'between-sets' | 'between-movements' | 'switch-sides',
		nextName: string,
		movementIndex?: number,
		setNumber?: number,
		side?: 'left' | 'right' | null
	) {
		restDuration = duration;
		restTimer = duration;
		restType = type;
		nextExerciseName = nextName;
		showRestTimer = true;
		restingMovementIndex = movementIndex ?? -1;
		activeRestSetNumber = setNumber ?? null;
		activeRestSide = side ?? null;

		if (restInterval) clearInterval(restInterval);

		scrollToRest();

		restInterval = setInterval(() => {
			restTimer--;
			if (restTimer <= 0) {
				finishRest();
			}
		}, 1000);
	}

	function finishRest() {
		if (restInterval) {
			clearInterval(restInterval);
			restInterval = null;
		}
		playBeep();
		showRestTimer = false;
		restingMovementIndex = -1;
		activeRestSetNumber = null;
		activeRestSide = null;
		scrollToNextIncompleteSet();
	}

	function skipRest() {
		finishRest();
	}

	function scrollToSet(routineMovementId: string, setNumber: number, side: 'left' | 'right' | null) {
		const key = `${routineMovementId}-${setNumber}-${side || 'none'}`;
		const element = document.getElementById(`set-${key}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
			element.classList.add('ring-2', 'ring-blue-500');
			setTimeout(() => {
				element.classList.remove('ring-2', 'ring-blue-500');
			}, 2000);
		}
	}

	function scrollToNextIncompleteSet() {
		for (let i = 0; i < data.allRoutineMovements.length; i++) {
			const rm = data.allRoutineMovements[i];
			const sets = rm.isBilateral ? rm.sets * 2 : rm.sets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key)) {
					activeMovementIndex = i;
					scrollToSet(rm.id, actualSetNumber, side);
					return;
				}
			}
		}
		// If all complete, stay on last movement but mark workout ready for completion
		activeMovementIndex = data.allRoutineMovements.length - 1;
	}

	let notesTimeout: ReturnType<typeof setTimeout> | null = null;
	let notesSavingStates: Record<string, boolean> = $state({});

	function handleNotesChange(routineMovementId: string, notes: string) {
		movementNotes[routineMovementId] = notes;
		notesSavingStates[routineMovementId] = true;

		// Debounce save
		if (notesTimeout) {
			clearTimeout(notesTimeout);
		}

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

				// Update wake lock
				if (settings.keepAwake && 'wakeLock' in navigator && !wakeLock) {
					navigator.wakeLock.request('screen').then((lock) => {
						wakeLock = lock;
					});
				} else if (!settings.keepAwake && wakeLock) {
					wakeLock.release();
					wakeLock = null;
				}

				// Update audio context
				if (settings.audioEnabled && !audioContext && 'AudioContext' in window) {
					audioContext = new AudioContext();
				}
			} else {
				settingsError = 'Failed to save settings';
			}
		} catch (error) {
			settingsError = 'Failed to save settings';
		} finally {
			isSavingSettings = false;
		}
	}

	function resetActiveSetTimer() {
		if (activeSetTimerInterval && activeSetTimerDuration > 0) {
			activeSetTimer = activeSetTimerDuration;
			activeSetTimerPaused = false;
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

		const result = await response.json();
		// SvelteKit actions return a JSON with a 'type' and 'data' (if success) or 'errors'
		// But since we are using fetch with a form action, it returns a special format
		// Actually, simpler to check response.ok and then use the data
		
		if (response.ok) {
			const rm = data.allRoutineMovements.find((m: any) => m.id === routineMovementId);
			if (rm) {
				const current = setOverrides[routineMovementId] ?? rm.sets;
				setOverrides[routineMovementId] = direction === 'up' ? current + 1 : Math.max(1, current - 1);
			}
		} else {
			const errorData = JSON.parse(result.data);
			alert(errorData.error || 'Failed to adjust sets');
		}

		isAdjustingSets[routineMovementId] = false;
	}

	function handleExit() {
		if (confirm('Exit practice? Your progress so far is saved.')) {
			if (isReadOnly) {
				window.location.href = `/routine/${routineId}`;
			} else {
				window.location.href = '/';
			}
		}
	}

	async function handleCompleteWorkout() {
		if (!confirm('Complete workout?')) return;

		isCompletingWorkout = true;

		await fetch('?/completePractice', {
			method: 'POST',
			body: new FormData()
		});

		goto(`/practice/${practiceId}/summary`);
	}

	async function handleSkipSet() {
		if (!settings.autoPlay) return;

		for (let i = 0; i < data.allRoutineMovements.length; i++) {
			const rm = data.allRoutineMovements[i];
			const sets = rm.isBilateral ? rm.sets * 2 : rm.sets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key)) {
					const setData = {
						setNumber: actualSetNumber,
						side,
						movementIndex: i,
						value: rm.target.value,
						weight: rm.weight,
						rating: 0
					};

					await handleSetComplete(setData);
					return;
				}
			}
		}
	}

	function isMovementCompleted(routineMovementId: string, totalSets: number): boolean {
		return countCompletedMovementSets(routineMovementId, false) >= totalSets;
	}
</script>

<svelte:head>
	<title>Practice - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
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
		<!-- Initial Rest indicator -->
		{#if settings.autoPlay && data.practice.routine.restBetweenMovements > 0}
			{@const isActive = showRestTimer && restType === 'between-movements' && restingMovementIndex === -1}
			{@const firstMovementCompleted = countCompletedMovementSets(data.allRoutineMovements[0].id, data.allRoutineMovements[0].isBilateral) > 0}
			<InlineRestTimer
				remainingTime={isActive ? restTimer : data.practice.routine.restBetweenMovements}
				totalDuration={data.practice.routine.restBetweenMovements}
				type="between-movements"
				nextExerciseName={data.allRoutineMovements[0].movement.name}
				onSkip={isActive ? skipRest : undefined}
				isActive={isActive}
				isCompleted={firstMovementCompleted}
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
			{@const isActive = index === activeMovementIndex && !isReadOnly}
			{@const movementPreviousStats = data.previousStatsMap[rm.id] || null}
			{@const isSavingNotes = notesSavingStates[rm.id]}

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
				notes={rm.notes || movementNotes[rm.id]}
				previousStats={movementPreviousStats}
				isActive={isActive}
				completedSets={completedSets}
				activeSetTimer={activeSetTimer}
				activeSetTimerPaused={activeSetTimerPaused}
				onToggleTimerPaused={toggleActiveSetTimerPaused}
				onResetTimer={resetActiveSetTimer}
				isSavingNotes={isSavingNotes}
				isCompletingSet={isCompletingSet}
				onSetComplete={handleSetComplete}
				onNotesChange={(notes: string) => handleNotesChange(rm.id, notes)}
				onAdjustSets={(direction) => handleAdjustSets(rm.id, direction)}
				isAdjustingSets={isAdjustingSets[rm.id]}
				
				activeRestType={restingMovementIndex === index && restType !== 'between-movements' ? restType : null}
				activeRestSetNumber={restingMovementIndex === index ? activeRestSetNumber : null}
				activeRestSide={restingMovementIndex === index ? activeRestSide : null}
				restRemainingTime={restTimer}
				restBetweenSetsDuration={data.practice.routine.restBetweenSets}
				onSkipRest={skipRest}
			/>

			{#if index < data.allRoutineMovements.length - 1}
				{@const isRestActive = showRestTimer && restType === 'between-movements' && restingMovementIndex === index}
				{@const currentMovementSets = rm.isBilateral ? rm.sets * 2 : rm.sets}
				{@const isCurrentMovementComplete = countCompletedMovementSets(rm.id, rm.isBilateral) >= currentMovementSets}
				{@const nextMovement = data.allRoutineMovements[index + 1]}
				{@const isNextMovementStarted = countCompletedMovementSets(nextMovement.id, nextMovement.isBilateral) > 0}
				
				<InlineRestTimer
					remainingTime={isRestActive ? restTimer : data.practice.routine.restBetweenMovements}
					totalDuration={data.practice.routine.restBetweenMovements}
					type="between-movements"
					nextExerciseName={nextMovement.movement.name}
					onSkip={isRestActive ? skipRest : undefined}
					isActive={isRestActive}
					isCompleted={isNextMovementStarted}
				/>
			{/if}
		{/each}
	</main>

	{#if !isReadOnly}
		<PracticeFooter
			completedSets={completedSetsCount}
			{totalSets}
			onSkipSet={settings.autoPlay ? handleSkipSet : undefined}
			onCompleteWorkout={allSetsComplete ? handleCompleteWorkout : undefined}
			isCompletingWorkout={isCompletingWorkout}
		/>
	{/if}

	<PracticeSettings
		show={showSettings}
		settings={settings}
		onSave={handleSettingsSave}
		onCancel={() => (showSettings = false)}
		isSaving={isSavingSettings}
		error={settingsError}
	/>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
