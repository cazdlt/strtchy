<script lang="ts">
	import { untrack } from 'svelte';
	import { formatTime, getRelativeTime } from '$lib/utils/formatting';

	let {
		setNumber,
		movementType = 'reps',
		targetValue = 0,
		weight = null,
		weightUnit = 'kg',
		isBilateral = false,
		side = null,
		previousStats = null,
		isActive = false,
		isCompleted = false,
		isSkipped = false,
		completedValue = null,
		isPreview = false,
		timePerRep = null,
		onComplete,
		onUncomplete,
		onSkip,
		onValueChange,
		activeSetTimer = 0,
		activeSetTimerPaused = false,
		onToggleTimerPaused,
		onResetTimer,
		isCompleting = false,
		id = '',
		isPaused = false,
		isInRestPeriod = false,
		onRepIncrement
	} = $props<{
		setNumber: number;
		movementType: 'timed' | 'reps' | 'weighted' | 'resistance_band';
		targetValue: number;
		weight?: number | null;
		weightUnit?: string | null;
		timePerRep?: number | null;
		isBilateral?: boolean;
		side?: 'left' | 'right' | null;
		previousStats?: any;
		isActive?: boolean;
		isCompleted?: boolean;
		isSkipped?: boolean;
		completedValue?: number | null;
		isPreview?: boolean;
		onComplete?: (data: any) => void;
		onUncomplete?: (data: any) => void;
		onSkip?: () => void;
		onValueChange?: (value: number, weight?: number) => void;
		activeSetTimer?: number;
		activeSetTimerPaused?: boolean;
		onToggleTimerPaused?: () => void;
		onResetTimer?: () => void;
		isCompleting?: boolean;
		id?: string;
		isPaused?: boolean;
		isInRestPeriod?: boolean;
		onRepIncrement?: () => void;
	}>();

	let currentValue = $state(0);
	// svelte-ignore state_referenced_locally
	let currentWeight = $state(weight || 0);
	let effortRating = $state(0);
	let autoRepInterval: ReturnType<typeof setInterval> | null = $state(null);
	let prevIsActive = $state(false);

	// Initialize values only when transitioning from inactive to active (untrack to avoid circular deps)
	$effect(() => {
		const active = isActive; // read reactivity
		if (active && !prevIsActive) {
			untrack(() => {
				if (!isCompleted && !isSkipped) {
					currentValue = 0;
					currentWeight = weight || 0;
				}
				prevIsActive = true;
			});
		} else if (!active) {
			untrack(() => {
				prevIsActive = false;
			});
		}
	});

	const displayValue = $derived((isCompleted || isSkipped) && completedValue !== null && completedValue !== undefined ? completedValue : currentValue);

	// Auto-increment rep counter for rep-based exercises with timePerRep
	$effect(() => {
		if (isActive && !isCompleted && !isSkipped && !isPaused && !isInRestPeriod && timePerRep && timePerRep > 0 && movementType !== 'timed') {
			// Start auto-increment timer (untrack interval check to avoid circular dep)
			const hasInterval = untrack(() => autoRepInterval !== null);
			if (!hasInterval) {
				const interval = setInterval(() => {
					untrack(() => {
						if (currentValue < targetValue) {
							handleValueChange(currentValue + 1);
							// Play subtle sound for each rep
							onRepIncrement?.();
						} else {
							// Reached target, auto-complete
							if (autoRepInterval) {
								clearInterval(autoRepInterval);
								autoRepInterval = null;
							}
							handleComplete();
						}
					});
				}, timePerRep * 1000);
				autoRepInterval = interval;
			}
		} else {
			// Clear interval when not active or completed
			untrack(() => {
				if (autoRepInterval) {
					clearInterval(autoRepInterval);
					autoRepInterval = null;
				}
			});
		}

		return () => {
			if (autoRepInterval) {
				clearInterval(autoRepInterval);
				autoRepInterval = null;
			}
		};
	});

	function handleComplete() {
		if (isPaused) return;

		if (isCompleted || isSkipped) {
			if (onUncomplete) {
				onUncomplete({
					value: currentValue,
					weight: movementType === 'weighted' || movementType === 'resistance_band' ? currentWeight : null,
					weightUnit,
					rating: effortRating
				});
			}
			return;
		}

		const value = (movementType === 'timed')
			? (activeSetTimer > 0 ? activeSetTimer : targetValue)
			: currentValue;

		if (onComplete) {
			onComplete({
				value,
				weight: movementType === 'weighted' || movementType === 'resistance_band' ? currentWeight : null,
				weightUnit,
				rating: effortRating,
				skipped: false
			});
		}
	}

	function handleValueChange(newValue: number) {
		currentValue = newValue;
		if (onValueChange) {
			onValueChange(newValue, currentWeight);
		}
	}

	function handleWeightChange(newWeight: number) {
		currentWeight = newWeight;
		if (onValueChange) {
			onValueChange(currentValue, newWeight);
		}
	}

	function getSetDisplay() {
		if (isBilateral && side) {
			return `${setNumber}${side === 'left' ? 'L' : 'R'}`;
		}
		return `${setNumber}`;
	}
</script>

<div
	{id}
	class="flex items-center gap-3 p-3 border transition-all {isActive
		? 'border-accent-primary bg-accent-primary/5'
		: 'border-accent-track hover:border-accent-primary'}"
>
	<div class="w-12 text-sm font-display text-text-secondary">
		{getSetDisplay()}
	</div>

	<div class="flex-1">
		{#if previousStats}
			<div class="text-sm text-text-secondary mb-1 font-body">
				{#if movementType === 'timed'}
					{formatTime(previousStats.value)}{#if previousStats.rating} @ {previousStats.rating}{/if}
				{:else if movementType === 'reps'}
					{previousStats.value} reps{#if previousStats.rating} @ {previousStats.rating}{/if}
				{:else if movementType === 'weighted' || movementType === 'resistance_band'}
					{previousStats.weight}{previousStats.weightUnit} × {previousStats.value}{#if previousStats.rating} @ {previousStats.rating}{/if}
				{/if}
				{#if previousStats.completedAt}
					<span class="ml-2">({getRelativeTime(new Date(previousStats.completedAt))})</span>
				{/if}
			</div>
		{:else}
			<div class="text-sm text-text-muted mb-1 font-body">No previous data</div>
		{/if}

		<div class="flex items-center gap-2">
			{#if movementType === 'timed'}
				{#if !isPreview && isActive && activeSetTimer > 0}
					<div class="flex items-center gap-2">
						<button
							onclick={() => onToggleTimerPaused?.()}
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
							onclick={() => onResetTimer?.()}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track border border-accent-track flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
							aria-label="Reset timer"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
							</svg>
						</button>
						<div class="font-bold w-24 text-center transition-all">
							<span class="text-3xl {activeSetTimerPaused ? 'text-warning' : 'text-text-primary'}">{formatTime(activeSetTimer)}</span>
							<span class="text-text-muted text-lg mx-1">/</span>
							<span class="text-text-secondary text-lg">{formatTime(targetValue)}</span>
						</div>
					</div>
				{:else}
			<div class="flex items-center gap-2">
					{#if !isPreview}
					<button
						onclick={() => handleValueChange(Math.max(0, currentValue - 5))}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						-
					</button>
				{/if}
				<div class="font-bold w-24 text-center transition-all {!isPreview && isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
					<span class="text-current">{formatTime(displayValue)}</span>
					<span class="text-text-muted text-lg mx-1">/</span>
					<span class="text-text-secondary text-lg">{formatTime(targetValue)}</span>
				</div>
					{#if !isPreview}
					<button
						onclick={() => handleValueChange(currentValue + 5)}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						+
					</button>
				{/if}
					</div>
				{/if}
			{:else if movementType === 'reps'}
			<div class="flex items-center gap-2">
				{#if !isPreview}
					<button
						onclick={() => handleValueChange(Math.max(0, currentValue - 1))}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						-
					</button>
				{/if}
				<div class="font-bold w-20 text-center transition-all {!isPreview && isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
					<span class="text-current">{displayValue}</span>
					<span class="text-text-muted text-lg mx-1">/</span>
					<span class="text-text-secondary text-lg">{targetValue}</span>
				</div>
				{#if !isPreview}
					<button
						onclick={() => handleValueChange(currentValue + 1)}
						disabled={isPaused}
						class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
					>
						+
					</button>
				{/if}
				{#if isActive && timePerRep && timePerRep > 0}
					<span class="text-xs text-success bg-success/10 px-2 py-0.5 ml-1">
						{timePerRep}s/rep
					</span>
				{/if}
			</div>
			{:else if movementType === 'weighted' || movementType === 'resistance_band'}
				<div class="flex items-center gap-2">
					{#if !isPreview}
						<button
							onclick={() => handleWeightChange(Math.max(0, currentWeight - 5))}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							-
						</button>
					{/if}
					<span class="font-bold w-16 text-center transition-all {!isPreview && isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">{currentWeight}</span>
					{#if !isPreview}
						<button
							onclick={() => handleWeightChange(currentWeight + 5)}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							+
						</button>
					{/if}
					<span class="text-text-secondary text-sm">{weightUnit}</span>
					<span class="text-text-muted mx-1">×</span>
					{#if !isPreview}
						<button
							onclick={() => handleValueChange(Math.max(0, currentValue - 1))}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							-
						</button>
					{/if}
					<div class="font-bold w-20 text-center transition-all {!isPreview && isActive ? 'text-3xl text-accent-primary' : 'text-2xl text-text-primary'}">
						<span class="text-current">{displayValue}</span>
						<span class="text-text-muted text-lg mx-1">/</span>
						<span class="text-text-secondary text-lg">{targetValue}</span>
					</div>
					{#if !isPreview}
						<button
							onclick={() => handleValueChange(currentValue + 1)}
							disabled={isPaused}
							class="w-8 h-8 bg-surface-elevated hover:bg-accent-track disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated flex items-center justify-center text-text-primary"
						>
							+
						</button>
					{/if}
				</div>
			{/if}

			{#if !isPreview}
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
			{/if}
		</div>
	</div>

	{#if !isPreview}
		<div class="flex flex-col gap-2">
			{#if isActive && onSkip}
				<button
					onclick={onSkip}
					disabled={isCompleting || isPaused}
					class="text-xs font-title font-bold uppercase tracking-wider py-1 px-3 bg-surface-elevated hover:bg-accent-track disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated transition-colors text-text-secondary w-full text-center"
				>
					Skip
				</button>
			{/if}
			<button
				onclick={handleComplete}
				disabled={isCompleting || isPaused}
				class="px-4 h-11 flex items-center justify-center font-display text-lg tracking-widest uppercase transition-colors {isCompleted
					? 'bg-success/20 text-success border border-success/30 hover:bg-success/30'
					: isSkipped
					? 'bg-surface-elevated text-text-muted border border-accent-track'
					: isActive
					? 'bg-accent-primary hover:bg-accent-primary-light text-white'
					: 'bg-surface-elevated border border-accent-track hover:border-accent-primary text-text-secondary'} disabled:opacity-50 disabled:cursor-not-allowed"
				aria-label={isCompleted || isSkipped ? "Un-complete set {setNumber}" : isActive ? "Complete set {setNumber}" : "Start set {setNumber}"}
			>
				{#if isCompleting}
					<svg class="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{:else if isCompleted}
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
{/if}
</div>
