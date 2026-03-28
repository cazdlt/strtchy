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
	let countdownPlayedForSet = $state<string | null>(null);

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
	let wakeLockError = $state<string | null>(null);

	// Practice start state
	let hasStarted = $state(false);

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

	// Rest period state - true when any rest timer is active
	let isInRestPeriod = $derived(showRestTimer);

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

		// Auto-start if practice has already started (existing practice with data)
		if (data.practice.practiceData.length > 0) {
			hasStarted = true;
			startPractice(false);
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

	function startPractice(playStartSound = true) {
		// Request wake lock (requires user gesture context)
		if (settings.keepAwake && 'wakeLock' in navigator) {
			navigator.wakeLock.request('screen').then((lock) => {
				wakeLock = lock;
				wakeLockError = null;
				
				// Listen for release (e.g., when tab loses focus)
				lock.addEventListener('release', () => {
					wakeLock = null;
				});
			}).catch((err) => {
				console.error('Wake lock error:', err);
				wakeLockError = 'Screen may turn off. Tap to re-enable.';
			});
		}

		// Start duration timer
		durationInterval = setInterval(() => {
			if (!isPaused) {
				duration++;
			}
		}, 1000);

		// Start initial rest if auto-play is enabled
		if (settings.autoPlay && data.practice.routine.restBetweenMovements > 0) {
			const firstMovement = data.allRoutineMovements[0];
			startRestTimer(
				data.practice.routine.restBetweenMovements,
				'between-movements',
				firstMovement.movement.name
			);
		}

		// Initialize audio context
		if (settings.audioEnabled && !audioContext && 'AudioContext' in window) {
			audioContext = new AudioContext();
		}

		// Play start sound if requested
		if (playStartSound && settings.audioEnabled) {
			playSound('setStart');
		}
	}

	// Handle re-requesting wake lock when user interacts
	function handleUserInteraction() {
		if (settings.keepAwake && !wakeLock && 'wakeLock' in navigator) {
			navigator.wakeLock.request('screen').then((lock) => {
				wakeLock = lock;
				wakeLockError = null;
				lock.addEventListener('release', () => {
					wakeLock = null;
				});
			}).catch((err) => {
				console.error('Wake lock re-request error:', err);
			});
		}
	}

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
		if (!hasStarted || !settings.autoPlay || isReadOnly || isAutoCompletingSet || isAutoAdvancing || restInterval !== null) {
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
		countdownPlayedForSet = null;

		if (activeSetTimerInterval) {
			clearInterval(activeSetTimerInterval);
		}

		activeSetTimerInterval = setInterval(async () => {
			if (!activeSetTimerPaused && !isPaused) {
				activeSetTimer++;
				lastActiveSetTimerValue = activeSetTimer;

				// Play countdown at 3-2-1 seconds remaining
				const remaining = duration - activeSetTimer;
				if (remaining <= 3 && remaining > 0 && countdownPlayedForSet !== currentActiveSetKey) {
					playCountdown();
					countdownPlayedForSet = currentActiveSetKey;
				}

				if (activeSetTimer >= duration) {
					if (activeSetTimerInterval) {
						clearInterval(activeSetTimerInterval);
						activeSetTimerInterval = null;
					}
					// Small delay to let countdown sound finish
					await new Promise(r => setTimeout(r, 500));
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
				// Play countdown at 3-2-1 seconds remaining
				if (restTimer === 3) {
					playCountdown();
				}
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
	<!-- Start Practice Overlay -->
	{#if !hasStarted && !isReadOnly}
		<div class="fixed inset-0 bg-gray-950/95 z-50 flex flex-col items-center justify-center p-6">
			<!-- Back button -->
			<button
				onclick={() => goto(`/routine/${routineId}`)}
				class="absolute top-4 left-4 p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 z-50"
				aria-label="Back to routine"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
				</svg>
			</button>
			<div class="text-center max-w-md">
				<div class="mb-8">
					<div class="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-12 h-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
						</svg>
					</div>
					<h1 class="text-3xl font-bold text-white mb-2">{data.practice.routine.name}</h1>
					<p class="text-gray-400">Ready to begin?</p>
				</div>
				
				<div class="space-y-4 mb-8">
					<div class="flex items-center justify-center gap-6 text-sm text-gray-400">
						<div class="flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" />
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
							</svg>
							<span>{totalSets} sets</span>
						</div>
						{#if settings.autoPlay}
							<div class="flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
								</svg>
								<span>Auto-play on</span>
							</div>
						{/if}
						{#if settings.keepAwake}
							<div class="flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
								</svg>
								<span>Screen awake</span>
							</div>
						{/if}
					</div>
					
					{#if data.equipment.length > 0}
						<div class="mt-6 pt-6 border-t border-gray-800">
							<div class="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
								</svg>
								<span>Equipment needed</span>
							</div>
							<div class="flex flex-wrap justify-center gap-2">
								{#each data.equipment as item}
									<span class="px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-gray-300">
										{item}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				
				<button
					onclick={() => {
						hasStarted = true;
						startPractice();
					}}
					class="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
				>
					Start Practice
				</button>
			</div>
		</div>
	{/if}

	<!-- Wake Lock Warning -->
	{#if wakeLockError && hasStarted}
		<div class="fixed top-20 left-4 right-4 z-40" onclick={handleUserInteraction} onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && handleUserInteraction()} role="button" tabindex="0">
			<div class="bg-yellow-900/80 border border-yellow-600 rounded-xl p-4 flex items-center justify-between cursor-pointer">
				<div class="flex items-center gap-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-yellow-400">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
					</svg>
					<span class="text-yellow-200 text-sm">{wakeLockError}</span>
				</div>
				<button class="text-yellow-400 hover:text-yellow-200 text-sm font-medium">Tap to fix</button>
			</div>
		</div>
	{/if}

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
		{#if hasStarted && settings.autoPlay && data.practice.routine.restBetweenMovements > 0}
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
				
				isInRestPeriod={isInRestPeriod}
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
