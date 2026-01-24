<script lang="ts">
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
		isPreview = false,
		onComplete,
		onValueChange,
		activeSetTimer = 0,
		activeSetTimerPaused = false,
		onToggleTimerPaused,
		isCompleting = false,
		id = ''
	} = $props<{
		setNumber: number;
		movementType: 'timed' | 'reps' | 'weighted' | 'resistance';
		targetValue: number;
		weight?: number | null;
		weightUnit?: string | null;
		isBilateral?: boolean;
		side?: 'left' | 'right' | null;
		previousStats?: any;
		isActive?: boolean;
		isCompleted?: boolean;
		isPreview?: boolean;
		onComplete?: (data: any) => void;
		onValueChange?: (value: number, weight?: number) => void;
		activeSetTimer?: number;
		activeSetTimerPaused?: boolean;
		onToggleTimerPaused?: () => void;
		isCompleting?: boolean;
		id?: string;
	}>();

	let currentValue = $state(targetValue);
	let currentWeight = $state(weight || 0);
	let effortRating = $state(0);

	$effect(() => {
		currentValue = targetValue;
		currentWeight = weight || 0;
	});

	function handleComplete() {
		if (onComplete) {
			onComplete({
				value: currentValue,
				weight: movementType === 'weighted' || movementType === 'resistance' ? currentWeight : null,
				weightUnit,
				rating: effortRating
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
	class="flex items-center gap-3 p-3 rounded-lg border transition-all {isActive
		? 'border-blue-500 bg-blue-500/5'
		: 'border-gray-700 hover:border-gray-600'}"
>
	<div class="w-12 text-sm font-semibold text-gray-400">
		{getSetDisplay()}
	</div>

	<div class="flex-1">
		{#if previousStats}
			<div class="text-sm text-gray-500 mb-1">
				{#if movementType === 'timed'}
					{formatTime(previousStats.value)} @ {previousStats.rating || '-'}
				{:else if movementType === 'reps'}
					{previousStats.value} reps @ {previousStats.rating || '-'}
				{:else if movementType === 'weighted' || movementType === 'resistance'}
					{previousStats.weight}{previousStats.weightUnit} × {previousStats.value} @ {previousStats.rating || '-'}
				{/if}
				{#if previousStats.completedAt}
					<span class="ml-2">({getRelativeTime(new Date(previousStats.completedAt))})</span>
				{/if}
			</div>
		{:else}
			<div class="text-sm text-gray-600 mb-1">No previous data</div>
		{/if}

		<div class="flex items-center gap-2">
			{#if movementType === 'timed'}
				{#if !isPreview && isActive && activeSetTimer > 0}
					<div class="flex items-center gap-2">
						<button
							onclick={() => onToggleTimerPaused?.()}
							class="w-8 h-8 bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center text-white"
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
						<span class="text-3xl font-bold {activeSetTimerPaused ? 'text-yellow-400' : 'text-white'} w-16 text-center">{formatTime(activeSetTimer)}</span>
					</div>
				{:else}
					<div class="flex items-center gap-2">
						{#if !isPreview}
							<button
								onclick={() => handleValueChange(Math.max(0, currentValue - 5))}
								class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
							>
								-
							</button>
						{/if}
						<span class="text-2xl font-bold text-white w-16 text-center">{formatTime(currentValue)}</span>
						{#if !isPreview}
							<button
								onclick={() => handleValueChange(currentValue + 5)}
								class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
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
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							-
						</button>
					{/if}
					<span class="font-bold w-16 text-center transition-all {!isPreview && isActive ? 'text-3xl text-blue-400' : 'text-2xl text-white'}">{currentValue}</span>
					{#if !isPreview}
						<button
							onclick={() => handleValueChange(currentValue + 1)}
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							+
						</button>
					{/if}
				</div>
			{:else if movementType === 'weighted' || movementType === 'resistance'}
				<div class="flex items-center gap-2">
					{#if !isPreview}
						<button
							onclick={() => handleWeightChange(Math.max(0, currentWeight - 5))}
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							-
						</button>
					{/if}
					<span class="font-bold w-16 text-center transition-all {!isPreview && isActive ? 'text-3xl text-blue-400' : 'text-2xl text-white'}">{currentWeight}</span>
					{#if !isPreview}
						<button
							onclick={() => handleWeightChange(currentWeight + 5)}
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							+
						</button>
					{/if}
					<span class="text-gray-400 text-sm">{weightUnit}</span>
					<span class="text-gray-500 mx-1">×</span>
					{#if !isPreview}
						<button
							onclick={() => handleValueChange(Math.max(0, currentValue - 1))}
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							-
						</button>
					{/if}
					<span class="font-bold w-16 text-center transition-all {!isPreview && isActive ? 'text-3xl text-blue-400' : 'text-2xl text-white'}">{currentValue}</span>
					{#if !isPreview}
						<button
							onclick={() => handleValueChange(currentValue + 1)}
							class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-white"
						>
							+
						</button>
					{/if}
				</div>
			{/if}

			{#if !isPreview}
				<div class="flex items-center gap-2 ml-4">
					<span class="text-sm text-gray-400">Effort</span>
					<input
						type="number"
						bind:value={effortRating}
						min="1"
						max="10"
						placeholder="-"
						class="w-12 bg-gray-800 border border-gray-600 rounded text-center text-white text-sm py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					/>
				</div>
			{/if}
		</div>
	</div>

	{#if !isPreview}
		<button
			onclick={handleComplete}
			disabled={isCompleting || isCompleted}
			class="w-11 h-11 rounded-lg flex items-center justify-center border-2 transition-all {isCompleted
				? 'bg-emerald-500 border-emerald-500 text-white'
				: isActive
				? 'border-blue-500 hover:border-blue-400 text-blue-500 animate-pulse'
				: 'border-gray-600 hover:border-gray-500 text-gray-500'} disabled:opacity-50 disabled:cursor-not-allowed"
			aria-label="Complete set {setNumber}"
		>
			{#if isCompleting}
				<svg class="animate-spin h-6 w-6 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{:else if isCompleted}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="3"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4.5 12.75l6 6 9-13.5"
					/>
				</svg>
			{/if}
		</button>
	{/if}
</div>
