<script lang="ts">
	import SetRow from './SetRow.svelte';
	import RestRow from './RestRow.svelte';

	let {
		movementIndex,
		routineMovementId,
		movementName,
		movementType,
		description,
		targetValue,
		sets,
		isBilateral,
		switchSidesDuration,
		weight = null,
		weightUnit = null,
		notes = null,
		previousStats,
		isActive,
		completedSets,
		skippedSets = new Set<string>(),
		completedValues = {},
		onSetComplete,
		onNotesChange,
		activeSetTimer = 0,
		activeSetTimerPaused = false,
		onToggleTimerPaused,
		onResetTimer,
		isSavingNotes = false,
		isCompletingSet = false,
		isPreview = false,
		onAdjustSets,
		onSkipSet,
		onUncompleteSet,
		isAdjustingSets = false,
		// Reorder/Remove
		onMoveUp,
		onMoveDown,
		onRemove,
		isFirst = false,
		isLast = false,
		// Rest State
		activeRestType = null,
		activeRestSetNumber = null,
		activeRestSide = null,
		restRemainingTime = 0,
		restBetweenSetsDuration = 0,
		onSkipRest
	} = $props<{
		movementIndex: number;
		routineMovementId: string;
		movementName: string;
		movementType: 'timed' | 'reps' | 'weighted' | 'resistance';
		description?: string | null;
		targetValue: number;
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
		weight?: number | null;
		weightUnit?: string | null;
		notes?: string | null;
		previousStats?: any;
		isActive: boolean;
		completedSets: Set<string>;
		skippedSets?: Set<string>;
		completedValues?: Record<string, number>;
		onSetComplete: (setData: any) => void;
		onNotesChange: (notes: string) => void;
		activeSetTimer?: number;
		activeSetTimerPaused?: boolean;
		onToggleTimerPaused?: () => void;
		onResetTimer?: () => void;
		isSavingNotes?: boolean;
		isCompletingSet?: boolean;
		isPreview?: boolean;
		onAdjustSets?: (direction: 'up' | 'down') => void;
		onSkipSet?: () => void;
		onUncompleteSet?: (setData: any) => void;
		isAdjustingSets?: boolean;
		// Reorder/Remove
		onMoveUp?: () => void;
		onMoveDown?: () => void;
		onRemove?: () => void;
		isFirst?: boolean;
		isLast?: boolean;
		// Rest State
		activeRestType?: 'between-sets' | 'switch-sides' | null;
		activeRestSetNumber?: number | null;
		activeRestSide?: 'left' | 'right' | null;
		restRemainingTime?: number;
		restBetweenSetsDuration?: number;
		onSkipRest?: () => void;
	}>();

	let collapsed = $state(false);
	let currentNotes = $state(notes || '');

	$effect(() => {
		if (isActive) {
			collapsed = false;
		}
	});

	$effect(() => {
		currentNotes = notes || '';
	});

	function generateItems() {
		const result: Array<{
			type: 'set' | 'rest';
			setNumber?: number;
			side?: 'left' | 'right' | null;
			restType?: 'switch-sides' | 'between-sets';
			duration?: number;
			label?: string;
			key: string;
		}> = [];

		for (let i = 1; i <= sets; i++) {
			if (isBilateral) {
				// Left side
				result.push({ type: 'set', setNumber: i, side: 'left', key: `${i}L` });

				// Switch sides rest
				if (switchSidesDuration > 0) {
					result.push({
						type: 'rest',
						restType: 'switch-sides',
						duration: switchSidesDuration,
						label: 'Switch Sides',
						key: `${i}-switch`,
						setNumber: i,
						side: 'left'
					});
				}

				// Right side
				result.push({ type: 'set', setNumber: i, side: 'right', key: `${i}R` });
			} else {
				result.push({ type: 'set', setNumber: i, side: null, key: `${i}` });
			}

			// Rest between sets
			if (i < sets && restBetweenSetsDuration > 0) {
				result.push({
					type: 'rest',
					restType: 'between-sets',
					duration: restBetweenSetsDuration,
					label: 'Rest between sets',
					key: `${i}-rest`,
					setNumber: i
				});
			}
		}

		return result;
	}

	const items = $derived(generateItems());

	function handleSetComplete(data: any, setNumber: number, side: 'left' | 'right' | null) {
		onSetComplete({
			...data,
			setNumber,
			side,
			movementIndex
		});
	}

	function handleUncompleteSet(data: any, setNumber: number, side: 'left' | 'right' | null) {
		onUncompleteSet?.({
			...data,
			setNumber,
			side,
			routineMovementId
		});
	}

	function getSetKey(setNumber: number, side: 'left' | 'right' | null): string {
		return `${routineMovementId}-${setNumber}-${side || 'none'}`;
	}

	function isSetCompleted(setNumber: number, side: 'left' | 'right' | null): boolean {
		return completedSets.has(getSetKey(setNumber, side));
	}

	function isSetSkipped(setNumber: number, side: 'left' | 'right' | null): boolean {
		return skippedSets.has(getSetKey(setNumber, side));
	}

	function isSetActive(setNumber: number, side: 'left' | 'right' | null): boolean {
		if (!isActive || activeRestType) return false;

		const firstIncomplete = items.find(
			(item) =>
				item.type === 'set' &&
				!completedSets.has(`${routineMovementId}-${item.setNumber}-${item.side || 'none'}`) &&
				!skippedSets.has(`${routineMovementId}-${item.setNumber}-${item.side || 'none'}`)
		);

		return firstIncomplete?.setNumber === setNumber && firstIncomplete?.side === side;
	}

	function isRestActive(item: any): boolean {
		if (!isActive || !activeRestType) return false;
		const sideMatch = item.side ? activeRestSide === item.side : !activeRestSide;
		return (
			activeRestType === item.restType &&
			activeRestSetNumber === item.setNumber &&
			sideMatch
		);
	}

	function isRestCompleted(item: any): boolean {
		// A rest is completed if the NEXT set in the sequence is completed
		const itemIndex = items.findIndex((i) => i.key === item.key);
		for (let i = itemIndex + 1; i < items.length; i++) {
			const next = items[i];
			if (next.type === 'set') {
				return isSetCompleted(next.setNumber!, next.side!);
			}
		}
		return false;
	}

	function getSetElementId(setNumber: number, side: 'left' | 'right' | null): string {
		return `set-${getSetKey(setNumber, side)}`;
	}

	function getRestElementId(item: any): string {
		return `rest-${routineMovementId}-${item.key}`;
	}

	function handleNotesChange(notes: string) {
		currentNotes = notes;
		onNotesChange(notes);
	}
</script>

<div class="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden mb-4">
	<div class="w-full p-4 flex items-start gap-3">
		<div class="flex flex-col items-center gap-1 flex-shrink-0">
			<button
				onclick={() => (collapsed = !collapsed)}
				class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
			>
				{movementIndex + 1}
			</button>
			{#if !isPreview}
				<div class="flex flex-col gap-1">
					<button
						onclick={() => onMoveUp?.()}
						disabled={isFirst}
						class="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
						aria-label="Move up"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
						</svg>
					</button>
					<button
						onclick={() => onMoveDown?.()}
						disabled={isLast}
						class="w-6 h-6 flex items-center justify-center rounded bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
						aria-label="Move down"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex-1 min-w-0 text-left hover:bg-gray-700/50 transition-colors rounded-lg p-2 -m-2"
		>
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-semibold text-white">{movementName}</h3>
				<span
					class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
				>
					{movementType}
				</span>
				{#if isBilateral}
					<span
						class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-400"
					>
						L/R
					</span>
				{/if}
			</div>
			{#if description}
				<p class="text-gray-400 text-sm mt-1 line-clamp-2">{description}</p>
			{/if}
		</button>
		<div class="flex items-center gap-2 flex-shrink-0">
			{#if !isPreview}
				<button
					onclick={() => onRemove?.()}
					class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-400/50 transition-all"
					aria-label="Remove movement"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		<button
			onclick={() => (collapsed = !collapsed)}
			class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
			aria-label={collapsed ? 'Expand' : 'Collapse'}
		>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5 transition-transform {collapsed ? 'rotate-180' : ''}"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<div class="border-t border-gray-700 p-2 space-y-2">
			<!-- Notes Section -->
			{#if !isPreview || notes}
				<div class="px-2 pb-2 mb-2 border-b border-gray-700/50">
					{#if isPreview}
						<div class="flex items-center gap-2 mb-1">
							<span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notes</span>
						</div>
						<p class="text-sm text-gray-300 italic">"{notes}"</p>
					{:else}
						<div class="mb-2 flex items-center gap-2">
							<span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notes</span>
							{#if isSavingNotes}
								<svg
									class="animate-spin h-3 w-3 text-blue-400"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{/if}
						</div>
						<textarea
							bind:value={currentNotes}
							oninput={(e) => handleNotesChange(e.currentTarget.value)}
							rows="2"
							class="w-full bg-gray-900/50 border border-gray-700 rounded-lg text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none placeholder:text-gray-700"
							placeholder="Add notes about this movement..."
							aria-label="Movement notes"
						></textarea>
					{/if}
				</div>
			{/if}

			<!-- Set Controller (Adjust Sets) -->
			{#if !isPreview && isActive}
				<div class="px-2 pb-2 mb-2 flex items-center justify-between border-b border-gray-700/50">
					<span class="text-[10px] font-bold uppercase tracking-wider text-gray-500">Adjust Sets</span>
					<div class="flex items-center gap-3">
						<button
							onclick={() => onAdjustSets?.('down')}
							disabled={isAdjustingSets || sets <= 1}
							class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 transition-all"
							aria-label="Remove set"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
							</svg>
						</button>
						<span class="text-sm font-bold text-blue-400 min-w-[3rem] text-center">{sets} Sets</span>
						<button
							onclick={() => onAdjustSets?.('up')}
							disabled={isAdjustingSets}
							class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-50 transition-all"
							aria-label="Add set"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			{#each items as item (item.key)}
				{#if item.type === 'set'}
					{@const isCompleted = isSetCompleted(item.setNumber!, item.side!)}
					{@const isSkipped = isSetSkipped(item.setNumber!, item.side!)}
					{@const active = isSetActive(item.setNumber!, item.side!)}
					{@const showTimer = active && movementType === 'timed' && activeSetTimer > 0}
					{@const setKey = getSetKey(item.setNumber!, item.side!)}
					{@const completedValue = completedValues?.[setKey]}
					<SetRow
						id={getSetElementId(item.setNumber!, item.side!)}
						setNumber={item.setNumber!}
						{movementType}
						targetValue={targetValue}
						{weight}
						{weightUnit}
						{isBilateral}
						side={item.side!}
						previousStats={Array.isArray(previousStats) 
							? previousStats.find(ps => ps.setNumber === item.setNumber && (ps.side || null) === (item.side || null)) 
							: previousStats}
						isActive={active}
						isCompleted={isCompleted}
						isSkipped={isSkipped}
						{completedValue}
						{isPreview}
						activeSetTimer={showTimer ? activeSetTimer : 0}
						activeSetTimerPaused={activeSetTimerPaused}
						onToggleTimerPaused={showTimer ? onToggleTimerPaused : undefined}
						onResetTimer={showTimer ? onResetTimer : undefined}
						isCompleting={isCompletingSet}
						onComplete={(data) => handleSetComplete(data, item.setNumber!, item.side!)}
						onUncomplete={(data) => handleUncompleteSet(data, item.setNumber!, item.side!)}
						onSkip={active ? onSkipSet : undefined}
					/>
				{:else}
					{@const active = isRestActive(item)}
					{@const completed = isRestCompleted(item)}
					<RestRow
						id={getRestElementId(item)}
						label={item.label}
						duration={item.duration!}
						remainingTime={active ? restRemainingTime : item.duration}
						isActive={active}
						isCompleted={completed}
						{isPreview}
						onSkip={onSkipRest}
					/>
				{/if}
			{/each}

		</div>
	{/if}
</div>
