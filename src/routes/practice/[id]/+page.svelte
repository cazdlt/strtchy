<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import InlineRestTimer from '../../../components/practice/InlineRestTimer.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';
	import PracticeFooter from '../../../components/practice/PracticeFooter.svelte';
	import PracticeSettings from '../../../components/practice/PracticeSettings.svelte';
	import PracticePauseBanner from '../../../components/practice/PracticePauseBanner.svelte';
	import { formatTime } from '$lib/utils/formatting';
	import { nanoid } from 'nanoid';

	let { data } = $props<{ data: PageData }>();

	// Practice session state
	// svelte-ignore state_referenced_locally
	let practiceId = $state(data.practice.id);
	// svelte-ignore state_referenced_locally
	let routineId = $state(data.practice.routineId);

	// Settings state
	// svelte-ignore state_referenced_locally
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
	let lastActiveSetTimerValue = $state(0);

	// Practice data state
	let completedSets = $state<Set<string>>(new Set());
	let skippedSets = $state<Set<string>>(new Set());
	let completedValues = $state<Record<string, number>>({});
	let movementNotes = $state<Record<string, string>>({});
	let isAutoCompletingSet = $state(false);
	let currentActiveSetKey = $state<string | null>(null);
	let isAutoAdvancing = $state(false);
	// svelte-ignore state_referenced_locally
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
	// svelte-ignore state_referenced_locally
	let isReadOnly = $state(data.isReadOnly);

	// Movement management state
	let showAddMovementModal = $state(false);
	let isReordering = $state<Record<string, boolean>>({});
	let isRemoving = $state<Record<string, boolean>>({});
	let isAddingMovement = $state(false);

	// Pause state
	let isPaused = $state(false);

	onMount(() => {
		// Initialize completed/skipped sets from practice data
		for (const pd of data.practice.practiceData) {
			const key = `${pd.routineMovementId}-${pd.setNumber}-${pd.side || 'none'}`;
			if (pd.status === 'skipped') {
				skippedSets.add(key);
			} else {
				completedSets.add(key);
			}
		}
		completedSets = new Set(completedSets);
		skippedSets = new Set(skippedSets);

		// Start duration timer
		durationInterval = setInterval(() => {
			if (!isPaused) {
				duration++;
			}
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

	const completedSetsCount = $derived(completedSets.size + skippedSets.size);

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

			const actualSets = setOverrides[rm.id] ?? rm.sets;
			const sets = rm.isBilateral ? actualSets * 2 : actualSets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key) && !skippedSets.has(key)) {
					// This is the active set
					if (rm.target.type === 'time' && rm.target.value > 0) {
						// Only start/restart timer if active set changed
						if (currentActiveSetKey !== key) {
							playSound('setStart');
							playCountdown();
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

	type SoundType = 'countdown' | 'setStart' | 'setComplete' | 'restStart' | 'restEnd' | 'switchSides' | 'practiceComplete';

	function playSound(type: SoundType) {
		if (!settings.audioEnabled) return;

		if (!audioContext && 'AudioContext' in window) {
			audioContext = new AudioContext();
		}

		if (!audioContext) return;

		if (audioContext.state === 'suspended') {
			audioContext.resume();
		}

		const playTone = (freq: number, duration: number, delay: number = 0) => {
			const oscillator = audioContext!.createOscillator();
			const gainNode = audioContext!.createGain();
			oscillator.connect(gainNode);
			gainNode.connect(audioContext!.destination);
			oscillator.frequency.value = freq;
			oscillator.type = 'sine';
			const startTime = audioContext!.currentTime + delay;
			gainNode.gain.setValueAtTime(0.15, startTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
			oscillator.start(startTime);
			oscillator.stop(startTime + duration);
		};

		switch (type) {
			case 'countdown':
				playTone(880, 0.1, 0);
				playTone(880, 0.1, 0.15);
				playTone(880, 0.1, 0.3);
				break;
			case 'setStart':
				playTone(660, 0.15);
				break;
			case 'setComplete':
				playTone(523, 0.1);
				playTone(659, 0.1, 0.1);
				playTone(784, 0.15, 0.2);
				break;
			case 'restStart':
				playTone(440, 0.2);
				playTone(330, 0.2, 0.2);
				break;
			case 'restEnd':
				playTone(523, 0.1);
				playTone(659, 0.15, 0.1);
				break;
			case 'switchSides':
				playTone(698, 0.12);
				playTone(880, 0.12, 0.12);
				playTone(1047, 0.2, 0.24);
				break;
			case 'practiceComplete':
				playTone(523, 0.1);
				playTone(659, 0.1, 0.1);
				playTone(784, 0.1, 0.2);
				playTone(1047, 0.3, 0.3);
				break;
		}
	}

	async function playCountdown() {
		playSound('countdown');
		await new Promise((r) => setTimeout(r, 450));
	}

	function startActiveSetTimer(duration: number, onComplete: () => void) {
		activeSetTimerDuration = duration;
		activeSetTimer = 0;
		lastActiveSetTimerValue = 0;
		activeSetTimerPaused = false;

		if (activeSetTimerInterval) {
			clearInterval(activeSetTimerInterval);
		}

		activeSetTimerInterval = setInterval(async () => {
			if (!activeSetTimerPaused && !isPaused) {
				activeSetTimer++;
				lastActiveSetTimerValue = activeSetTimer;
				if (activeSetTimer >= duration) {
					if (activeSetTimerInterval) {
						clearInterval(activeSetTimerInterval);
						activeSetTimerInterval = null;
					}
					playSound('setComplete');
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
		const { setNumber, side, movementIndex, skipped = false } = setData;

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
		formData.append('status', skipped ? 'skipped' : 'completed');

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
			if (skipped) {
				skippedSets.add(key);
				skippedSets = new Set(skippedSets);
			} else {
				completedSets.add(key);
				completedSets = new Set(completedSets);
			}
			completedValues[key] = setData.value;
			currentActiveSetKey = null;

			playSound('setComplete');

			// Auto-play logic
			if (settings.autoPlay) {
				handleAutoPlay(rm, setNumber, side);
			}
		}

		isCompletingSet = false;
	}

	async function handleUncompleteSet(setData: any) {
		const { setNumber, side, routineMovementId } = setData;

		isCompletingSet = true;

		// Create form data
		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('setNumber', setNumber.toString());
		if (side) {
			formData.append('side', side);
		}

		// Delete from server
		const response = await fetch('?/uncompleteSet', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const key = `${routineMovementId}-${setNumber}-${side || 'none'}`;
			completedSets.delete(key);
			skippedSets.delete(key);
			delete completedValues[key];
			completedSets = new Set(completedSets);
			skippedSets = new Set(skippedSets);
			currentActiveSetKey = null;

			// After uncompleting, we might want to scroll back to it
			scrollToNextIncompleteSet();
		}

		isCompletingSet = false;
	}

	function handleAutoPlay(rm: any, setNumber: number, side: 'left' | 'right' | null) {
		// Find the movement index
		const movementIndex = data.allRoutineMovements.findIndex((m: any) => m.id === rm.id);

		// Check if this was a bilateral left side
		if (rm.isBilateral && side === 'left') {
			const nextSideKey = `${rm.id}-${setNumber}-right`;
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
				} else {
					scrollToNextIncompleteSet();
					return;
				}
			}
		}

		// Calculate total sets for this movement
		const actualSets = setOverrides[rm.id] ?? rm.sets;
		const movementTotalSets = rm.isBilateral ? actualSets * 2 : actualSets;
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
		for (const key of skippedSets) {
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

		if (type === 'switch-sides') {
			playSound('switchSides');
		} else {
			playSound('restStart');
		}
		restingMovementIndex = movementIndex ?? -1;
		activeRestSetNumber = setNumber ?? null;
		activeRestSide = side ?? null;

		if (restInterval) clearInterval(restInterval);

		scrollToRest();

		restInterval = setInterval(() => {
			if (!isPaused) {
				restTimer--;
				if (restTimer <= 0) {
					finishRest();
				}
			}
		}, 1000);
	}

	function finishRest() {
		if (restInterval) {
			clearInterval(restInterval);
			restInterval = null;
		}
		playSound('restEnd');
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
			const actualSets = setOverrides[rm.id] ?? rm.sets;
			const sets = rm.isBilateral ? actualSets * 2 : actualSets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key) && !skippedSets.has(key)) {
					activeMovementIndex = i;
					scrollToSet(rm.id, actualSetNumber, side);
					playSound('setStart');
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
			activeSetTimer = 0;
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
			
			// Wait for DOM update then scroll to the moved exercise
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
				window.location.href = `/routine/${routineId}`;
			} else {
				window.location.href = '/';
			}
		}
	}

	async function handleCompleteWorkout() {
		if (!confirm('Complete workout?')) return;

		isCompletingWorkout = true;
		playSound('practiceComplete');

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

		for (let i = 0; i < data.allRoutineMovements.length; i++) {
			const rm = data.allRoutineMovements[i];
			const actualSets = setOverrides[rm.id] ?? rm.sets;
			const sets = rm.isBilateral ? actualSets * 2 : actualSets;

			for (let j = 1; j <= sets; j++) {
				const side = rm.isBilateral ? (j % 2 === 1 ? 'left' : 'right') : null;
				const actualSetNumber = rm.isBilateral ? Math.ceil(j / 2) : j;
				const key = `${rm.id}-${actualSetNumber}-${side || 'none'}`;

				if (!completedSets.has(key) && !skippedSets.has(key)) {
					const setData = {
						setNumber: actualSetNumber,
						side,
						movementIndex: i,
						value: 0,
						weight: rm.weight,
						rating: 0,
						skipped: true
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

	// Group movements by type for the add modal
	const groupedMovements = $derived.by(() => {
		const groups: Record<string, any[]> = {
			Timed: [],
			Repetitions: [],
			Weighted: [],
			'Resistance Band': []
		};

		for (const movement of data.allMovements) {
			if (movement.type === 'timed') groups.Timed.push(movement);
			else if (movement.type === 'reps') groups.Repetitions.push(movement);
			else if (movement.type === 'weighted') groups.Weighted.push(movement);
			else if (movement.type === 'resistance_band') groups['Resistance Band'].push(movement);
		}

		return groups;
	});
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
			{@const isActive = index === activeMovementIndex && !isReadOnly}
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
				completedSets={completedSets}
				{skippedSets}
				{completedValues}
				activeSetTimer={activeSetTimer}
				activeSetTimerPaused={activeSetTimerPaused}
				onToggleTimerPaused={toggleActiveSetTimerPaused}
				onResetTimer={resetActiveSetTimer}
				isSavingNotes={isSavingNotes}
				isCompletingSet={isCompletingSet}
				onSetComplete={handleSetComplete}
				onNotesChange={(notes: string) => handleNotesChange(rm.id, notes)}
				onAdjustSets={(direction) => handleAdjustSets(rm.id, direction)}
				onUncompleteSet={handleUncompleteSet}
				isAdjustingSets={isAdjustingSets[rm.id]}
				onSkipSet={settings.autoPlay ? handleSkipSet : undefined}
				
				activeRestType={restingMovementIndex === index && restType !== 'between-movements' ? restType : null}
				activeRestSetNumber={restingMovementIndex === index ? activeRestSetNumber : null}
				activeRestSide={restingMovementIndex === index ? activeRestSide : null}
				restRemainingTime={restTimer}
				restBetweenSetsDuration={data.practice.routine.restBetweenSets}
				onSkipRest={skipRest}
				onMoveUp={() => handleMoveMovement(rm.id, 'up')}
				onMoveDown={() => handleMoveMovement(rm.id, 'down')}
				onRemove={() => handleRemoveMovement(rm.id)}
				isFirst={index === 0}
				isLast={index === data.allRoutineMovements.length - 1}
				isPaused={isPaused}
			/>
		</div>

			{#if index < data.allRoutineMovements.length - 1}
				{@const isRestActive = showRestTimer && restType === 'between-movements' && restingMovementIndex === index}
				{@const currentMovementSets = rm.isBilateral ? (setOverrides[rm.id] ?? rm.sets) * 2 : (setOverrides[rm.id] ?? rm.sets)}
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
		isCompletingWorkout={isCompletingWorkout}
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
		settings={settings}
		onSave={handleSettingsSave}
		onCancel={() => (showSettings = false)}
		isSaving={isSavingSettings}
		error={settingsError}
	/>

	<!-- Add Movement Modal -->
	{#if showAddMovementModal}
		<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
			<div class="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
				<div class="p-4 border-b border-gray-800 flex items-center justify-between">
					<h2 class="text-lg font-semibold text-white">Add Movement</h2>
					<button
						onclick={() => showAddMovementModal = false}
						disabled={isPaused}
						aria-label="Close"
						class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div class="p-4 overflow-y-auto flex-1">
					{#if isAddingMovement}
						<div class="flex items-center justify-center py-8">
							<svg class="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>
					{:else}
						{#each Object.entries(groupedMovements) as [category, movementsList]}
							{#if movementsList.length > 0}
								<div class="mb-4">
									<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{category}</h3>
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
										{#each movementsList as movement}
											<button
												onclick={() => handleAddMovement(movement.id)}
												disabled={isPaused}
												class="text-left p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-gray-800/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:bg-gray-800 transition-all"
											>
												<div class="font-medium text-sm text-white">{movement.name}</div>
												{#if movement.description}
													<div class="text-xs text-gray-400 mt-1 line-clamp-2">{movement.description}</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
