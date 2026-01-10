<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { scale } from 'svelte/transition';
	import { formatDuration, formatTime } from '$lib/utils/formatting';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Practice state
	let currentMovementIndex = $state(0);
	let currentSet = $state(1);
	let timer = $state<ReturnType<typeof setInterval> | null>(null);
	let restTimer = $state<ReturnType<typeof setInterval> | null>(null);
	let isResting = $state(false);
	let elapsedSeconds = $state(0);
	let restSeconds = $state(0);
	let showSuccess = $state(false);
	let setCounterTrigger = $state(0);
	let practiceDataState = $state(data.practice.practiceData || []);

	// Wake lock
	let wakeLock = $state<WakeLockSentinel | null>(null);

	// Audio context
	let audioContext = $state<AudioContext | null>(null);

	onMount(() => {
		// Request wake lock
		if ('wakeLock' in navigator) {
			navigator.wakeLock.request('screen').then((lock) => {
				wakeLock = lock;
			}).catch((err) => {
				console.error('Wake lock error:', err);
			});
		}

		// Initialize audio context
		if ('AudioContext' in window) {
			audioContext = new AudioContext();
		}

		// Start timer if needed
		if (isTimedMovement) {
			startTimer();
		}
	});

	onDestroy(() => {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (restTimer) {
			clearInterval(restTimer);
			restTimer = null;
		}
		if (wakeLock) wakeLock.release();
	});

	const isTimedMovement = $derived(data.allRoutineMovements[currentMovementIndex]?.target?.type === 'time');
	const targetValue = $derived(data.allRoutineMovements[currentMovementIndex]?.target?.value || 0);
	const currentRoutineMovement = $derived(data.allRoutineMovements[currentMovementIndex]);
	const isBilateral = $derived(currentRoutineMovement?.isBilateral ?? false);
	const currentSide = $derived(isBilateral ? (currentSet % 2 === 1 ? 'Left' : 'Right') : null);
	const previousMovement = $derived(data.allRoutineMovements[currentMovementIndex - 1]?.movement);
	const nextMovement = $derived(data.allRoutineMovements[currentMovementIndex + 1]?.movement);

	const completedSetsCount = $derived(practiceDataState.length);
	const currentProgress = $derived(data.totalSets > 0 ? completedSetsCount / data.totalSets : 0);

	function startTimer() {
		if (timer) clearInterval(timer);
		elapsedSeconds = 0;
		timer = setInterval(() => {
			elapsedSeconds++;
			if (elapsedSeconds >= targetValue) {
				if (timer) {
					clearInterval(timer);
					timer = null;
				}
				playBeep();
				// Auto-complete for timed movements
				completeTimedSet();
			}
		}, 1000);
	}

	function completeTimedSet() {
		// Submit the completed set
		const formData = new FormData();
		formData.append('routineMovementId', data.allRoutineMovements[currentMovementIndex].id);
		formData.append('setNumber', currentSet.toString());
		formData.append('value', elapsedSeconds.toString());
		formData.append('measurementType', 'time');

		fetch('?/completeSet', {
			method: 'POST',
			body: formData
		}).then(async (response) => {
			if (response.ok) {
				practiceDataState = [...practiceDataState, { id: 'temp' }]; // Add temp entry to trigger progress update
			}
			if (currentSet >= data.allRoutineMovements[currentMovementIndex].sets) {
				moveToNextMovement();
			} else {
				currentSet++;
				if (isTimedMovement) startTimer();
			}
		});
	}

	function moveToNextMovement() {
		if (audioContext?.state === 'suspended') {
			audioContext.resume();
		}

		if (isResting) {
			isResting = false;
			if (restTimer) {
				clearInterval(restTimer);
				restTimer = null;
			}
			if (isTimedMovement) startTimer();
		} else if (currentMovementIndex < data.allRoutineMovements.length - 1) {
			const restDuration = data.practice.routine.restBetweenMovements;
			const shouldRest = restDuration && data.practice.routine.autoAdvance;
			
			if (shouldRest) {
				startRest(restDuration);
			} else {
				currentMovementIndex++;
				currentSet = 1;
				if (isTimedMovement) startTimer();
			}
		} else {
			// Practice complete
			completePractice();
		}
	}

	function startRest(duration: number) {
		isResting = true;
		restSeconds = duration;
		playBeep();

		if (restTimer) clearInterval(restTimer);
		restTimer = setInterval(() => {
			restSeconds--;
			if (restSeconds <= 0) {
				if (restTimer) {
					clearInterval(restTimer);
					restTimer = null;
				}
				playBeep();
				isResting = false;
				currentMovementIndex++;
				currentSet = 1;
				if (isTimedMovement) startTimer();
			}
		}, 1000);
	}

	function playBeep() {
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

	function completePractice() {
		if (confirm('Are you sure you want to complete this practice?')) {
			const formData = new FormData();
			fetch('?/completePractice', {
				method: 'POST',
				body: formData
			}).then(() => {
				window.location.href = `/practice/${data.practice.id}/summary`;
			});
		}
	}

	function completeCurrentSet() {
		if (audioContext?.state === 'suspended') {
			audioContext.resume();
		}

		const formData = new FormData();
		formData.append('routineMovementId', data.allRoutineMovements[currentMovementIndex].id);
		formData.append('setNumber', currentSet.toString());
		formData.append('value', '1');
		formData.append('measurementType', 'reps');

		playBeep();
		showSuccess = true;
		setCounterTrigger++;

		fetch('?/completeSet', {
			method: 'POST',
			body: formData
		}).then(async (response) => {
			if (response.ok) {
				practiceDataState = [...practiceDataState, { id: 'temp' }]; // Add temp entry to trigger progress update
			}
			if (currentSet >= data.allRoutineMovements[currentMovementIndex].sets) {
				setTimeout(() => moveToNextMovement(), 300);
			} else {
				setTimeout(() => {
					currentSet++;
					showSuccess = false;
				}, 300);
			}
		});
	}

	function exitPractice() {
		if (confirm('Exit practice? Your progress so far is saved.')) {
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Practice - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white flex flex-col">
	<!-- Progress bar -->
	<div class="h-1 bg-gray-800">
		<div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300" style="width: {currentProgress * 100}%"></div>
	</div>

	<!-- Header -->
	<header class="p-4 border-b border-gray-800 flex justify-between items-center">
		<div>
			<h1 class="text-lg font-semibold">{data.practice.routine.name}</h1>
			<p class="text-sm text-gray-400">
				Movement {currentMovementIndex + 1} of {data.allRoutineMovements.length}
			</p>
		</div>
		<div class="flex items-center gap-4">
			<div class="text-sm text-gray-400">
				{completedSetsCount} / {data.totalSets} sets
			</div>
			<button
				onclick={exitPractice}
				class="text-gray-400 hover:text-white transition-colors text-2xl p-2"
				aria-label="Exit practice"
			>
				✕
			</button>
		</div>
	</header>

	<!-- Context bar -->
	<div class="bg-gray-900/50 border-b border-gray-800 px-4 py-2">
		<div class="flex justify-between items-center text-sm">
			<div class="flex-1">
				{#if previousMovement}
					<span class="text-gray-500">← {previousMovement.name}</span>
				{:else}
					<span class="text-gray-600">Start</span>
				{/if}
			</div>
			<div class="text-gray-400 text-xs px-2">●</div>
			<div class="flex-1 text-right">
				{#if nextMovement}
					<span class="text-gray-500">{nextMovement.name} →</span>
				{:else}
					<span class="text-gray-600">Finish</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Rest overlay -->
	{#if isResting}
		<div class="fixed inset-0 bg-gray-950/95 flex items-center justify-center z-50">
			<div class="text-center">
				<p class="text-xl text-gray-400 mb-4">Rest</p>
				<p class="text-8xl font-bold text-blue-400 mb-4">{formatTime(restSeconds)}</p>
				<button
					onclick={moveToNextMovement}
					class="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
				>
					Skip Rest
				</button>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<main class="flex-1 p-4 flex flex-col">
		{#if data.allRoutineMovements[currentMovementIndex]}
			{@const rm = data.allRoutineMovements[currentMovementIndex]}
			{@const m = rm.movement}

			<!-- Movement info -->
			<div class="flex-1 flex flex-col items-center justify-center">
				<div class="text-center mb-6">
					{#if currentSide}
						<span class="inline-block px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm mb-4">
							{currentSide} Side
						</span>
					{/if}
					{#key setCounterTrigger}
						<span
							class="inline-block px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-400 mb-4 block"
							in:scale={{ duration: 200 }}
						>
							Set {currentSet} of {rm.sets}
						</span>
					{/key}
					<h2 class="text-3xl font-bold mb-2">{m.name}</h2>
					<p class="text-gray-400 mb-6">{m.description}</p>

					<!-- Target info -->
					<div class="mb-6">
						{#if rm.target.type === 'time'}
							<div class="text-center">
								<p class="text-gray-400 text-sm mb-2">Hold for</p>
								<p class="text-6xl font-bold text-blue-400">{formatTime(elapsedSeconds)}</p>
								<p class="text-gray-500 text-sm mt-2">Target: {formatTime(rm.target.value)}</p>
							</div>
						{:else if rm.target.type === 'reps'}
							<div class="text-center">
								<p class="text-gray-400 text-sm mb-2">Complete</p>
								<p class="text-6xl font-bold text-blue-400">{rm.target.value}</p>
								<p class="text-gray-500 text-sm mt-2">reps</p>
							</div>
						{:else if rm.target.type === 'distance'}
							<div class="text-center">
								<p class="text-gray-400 text-sm mb-2">Complete</p>
								<p class="text-6xl font-bold text-blue-400">{rm.target.value}</p>
								<p class="text-gray-500 text-sm mt-2">{rm.target.unit || 'meters'}</p>
							</div>
						{/if}
					</div>

					<!-- Illustration -->
					{#if m.illustrationPath}
						<div class="mb-6 text-gray-600">
							{#if m.illustrationPath.startsWith('<svg')}
								<div class="w-48 h-48 mx-auto">
									{@html m.illustrationPath}
								</div>
							{:else}
								<img 
									src={m.illustrationPath} 
									alt={m.name} 
									class="w-48 h-48 object-contain mx-auto"
								/>
							{/if}
						</div>
					{/if}

					{#if rm.notes}
						<p class="text-gray-500 text-sm italic max-w-md">{rm.notes}</p>
					{/if}
				</div>
			</div>

			<!-- Action buttons -->
			<div class="flex gap-3 mt-auto">
				{#if !isTimedMovement}
					<button
						onclick={completeCurrentSet}
						class="flex-1 bg-gradient-to-r {showSuccess ? 'from-emerald-500 to-emerald-600' : 'from-blue-600 to-purple-600'} hover:from-blue-500 hover:to-purple-500 text-white py-6 px-8 rounded-xl font-semibold text-xl transition-all"
					>
						{showSuccess ? '✓ Done' : '✓ Complete Set'}
					</button>
				{/if}

				<button
					onclick={() => {
						if (confirm('Skip this set?')) {
							moveToNextMovement();
						}
					}}
					class="bg-gray-700 hover:bg-gray-600 text-white py-6 px-8 rounded-xl font-semibold transition-all"
				>
					Skip
				</button>
			</div>
		{:else}
			<!-- Practice complete -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center">
					<div class="text-6xl mb-6">🎉</div>
					<h2 class="text-3xl font-bold mb-4">Practice Complete!</h2>
					<p class="text-gray-400 mb-6">Great job!</p>
					<button
						onclick={completePractice}
						class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 px-8 rounded-xl font-semibold transition-all"
					>
						View Summary
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}

	:global(svg) {
		width: 120px;
		height: 120px;
	}
</style>
