<script lang="ts">
	import { getContext } from 'svelte';
	import { formatTime } from '$lib/utils/formatting';
	import type { PracticeSession } from '$lib/composables/PracticeSession.svelte';

	let {
		setNumber,
		movementId,
		movementType = 'reps',
		targetValue = 0,
		weight = null,
		weightUnit = 'kg',
		isBilateral = false,
		side = null,
		isActive = false,
		isCompleted = false,
		isSkipped = false,
		completedValue = null,
		onComplete,
		onUncomplete,
		onSkip,
		isPaused = false,
		isInRestPeriod = false,
	}: {
		setNumber: number;
		movementId: string;
		movementType: 'timed' | 'reps' | 'weighted' | 'resistance_band';
		targetValue: number;
		weight?: number | null;
		weightUnit?: string | null;
		isBilateral?: boolean;
		side?: 'left' | 'right' | null;
		isActive?: boolean;
		isCompleted?: boolean;
		isSkipped?: boolean;
		completedValue?: number | null;
		onComplete?: (data: { value: number; weight?: number | null; weightUnit?: string | null; rating?: number | null }) => void;
		onUncomplete?: () => void;
		onSkip?: () => void;
		isPaused?: boolean;
		isInRestPeriod?: boolean;
	} = $props();

	const session = getContext<PracticeSession>('practice');

	let currentValue = $state(0);
	let currentWeight = $state(0);
	let effortRating = $state(0);

	// Reset current values when becoming active
	$effect(() => {
		if (isActive && !isCompleted && !isSkipped) {
			currentValue = 0;
			currentWeight = weight || 0;
		}
	});

	// Timer info from session
	let activeSetTimerInfo = $derived(session?.timer?.activeSetInfo);
	let showTimer = $derived(isActive && movementType === 'timed' && activeSetTimerInfo && activeSetTimerInfo.duration > 0);
	let activeSetTimerValue = $derived(showTimer ? (activeSetTimerInfo?.elapsed ?? 0) : 0);
	let activeSetTimerPaused = $derived(showTimer ? (activeSetTimerInfo?.isPaused ?? false) : false);

	const displayValue = $derived((isCompleted || isSkipped) && completedValue !== null ? completedValue : currentValue);

	function handleComplete() {
		if (isPaused) return;

		if (isCompleted || isSkipped) {
			onUncomplete?.();
			return;
		}

		const value = movementType === 'timed'
			? (showTimer ? activeSetTimerValue : targetValue)
			: currentValue;

		onComplete?.({
			value,
			weight: (movementType === 'weighted' || movementType === 'resistance_band') ? currentWeight : null,
			weightUnit,
			rating: effortRating || undefined,
		});
	}

	function handleValueChange(newValue: number) {
		currentValue = newValue;
	}

	function handleWeightChange(newWeight: number) {
		currentWeight = newWeight;
	}

	function getSetDisplay() {
		if (isBilateral && side) {
			return `${setNumber}${side === 'left' ? 'L' : 'R'}`;
		}
		return `${setNumber}`;
	}
</script>

<div
	class="flex items-center gap-3 p-3 border transition-all {isActive
		? 'border-accent-primary bg-accent-primary/5'
		: 'border-accent-track hover:border-accent-primary'}"
>
	<div class="w-12 text-sm font-display text-text-secondary">
		{getSetDisplay()}
	</div>

	<div class="flex-1">
		<div class="flex items-center gap-2">
			{#if movementType === 'timed'}
				{#if showTimer}
					<div class="flex items-center gap-2">
						<button
							onclick={() => session.toggleActiveSetTimerPaused()}
							class="w-8 h-8 bg-accent-primary hover:bg-accent-primary-light flex items-center justify-center text-white"
							aria-label={activeSetTimerPaused ? 'Resume timer' : 'Pause timer'}
						>
							{#if activeSetTimerPaused}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
								</svg>
							{/if}
						</button>
						<button
							onclick={() => session.resetActiveSetTimer()}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track border border-accent-track flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
							aria-label="Reset timer"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
						</button>
						<div class="font-bold w-24 text-center transition-all">
							<span class="text-3xl {activeSetTimerPaused ? 'text-warning' : 'text-text-primary'}">{formatTime(activeSetTimerValue)}</span>
							<span class="text-text-muted text-lg mx-1">/</span>
							<span class="text-text-secondary text-lg">{formatTime(targetValue)}</span>
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-2">
						<button
							onclick={() => handleValueChange(Math.max(0, currentValue - 5))}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							-
						</button>
						<div class="font-bold w-24 text-center transition-all {isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
							<span class="text-current">{formatTime(displayValue)}</span>
							<span class="text-text-muted text-lg mx-1">/</span>
							<span class="text-text-secondary text-lg">{formatTime(targetValue)}</span>
						</div>
						<button
							onclick={() => handleValueChange(currentValue + 5)}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							+
						</button>
					</div>
				{/if}
			{:else if movementType === 'reps'}
				<div class="flex items-center gap-2">
					<button
						onclick={() => handleValueChange(Math.max(0, currentValue - 1))}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						-
					</button>
					<div class="font-bold w-20 text-center transition-all {isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
						<span class="text-current">{displayValue}</span>
						<span class="text-text-muted text-lg mx-1">/</span>
						<span class="text-text-secondary text-lg">{targetValue}</span>
					</div>
					<button
						onclick={() => handleValueChange(currentValue + 1)}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						+
					</button>
				</div>
			{:else if movementType === 'weighted' || movementType === 'resistance_band'}
				<div class="flex items-center gap-2">
					<button
						onclick={() => handleWeightChange(Math.max(0, currentWeight - 5))}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						-
					</button>
					<span class="font-bold w-16 text-center transition-all {isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">{currentWeight}</span>
					<button
						onclick={() => handleWeightChange(currentWeight + 5)}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						+
					</button>
					<span class="text-text-secondary text-sm">{weightUnit}</span>
					<span class="text-text-muted mx-1">×</span>
					<button
						onclick={() => handleValueChange(Math.max(0, currentValue - 1))}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						-
					</button>
					<div class="font-bold w-20 text-center transition-all {isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
						<span class="text-current">{displayValue}</span>
						<span class="text-text-muted text-lg mx-1">/</span>
						<span class="text-text-secondary text-lg">{targetValue}</span>
					</div>
					<button
						onclick={() => handleValueChange(currentValue + 1)}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						+
					</button>
				</div>
			{/if}

			<div class="flex items-center gap-2 ml-4">
				<span class="text-sm text-text-secondary font-body">Effort</span>
				<input
					type="number"
					bind:value={effortRating}
					min="1"
					max="10"
					placeholder="-"
					disabled={isPaused}
					class="w-12 bg-inset border-2 border-accent-track text-center text-text-primary text-sm py-1 focus:outline-none focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		{#if isActive && onSkip}
			<button
				onclick={onSkip}
				disabled={isPaused}
				class="text-xs font-title font-bold uppercase tracking-wider py-1 px-3 bg-surface-elevated hover:bg-accent-track disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated transition-colors text-text-secondary w-full text-center"
			>
				Skip
			</button>
		{/if}
		<button
			onclick={handleComplete}
			disabled={isPaused}
			class="px-4 h-11 flex items-center justify-center font-display text-lg tracking-widest uppercase transition-colors {isCompleted
				? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
				: isSkipped
				? 'bg-surface-elevated text-text-muted border border-accent-track'
				: isActive
				? 'bg-accent-primary hover:bg-accent-primary-light text-white'
				: 'bg-surface-elevated border border-accent-track hover:border-accent-primary text-text-secondary'} disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if isCompleted}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5 mr-1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
				Done
			{:else if isSkipped}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-1.5 opacity-70">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
				</svg>
				Skipped
			{:else if isActive}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
				Complete
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 mr-1.5 opacity-70">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Not started
			{/if}
		</button>
	</div>
</div>
