<script lang="ts">
	import { getContext } from 'svelte';
	import SetRow from './SetRow.svelte';
	import RestRow from './RestRow.svelte';
	import type { usePractice } from '$lib/composables/usePractice.svelte';

	interface MovementInfo {
		id: string;
		movement: {
			name: string;
			type: 'timed' | 'reps' | 'weighted' | 'resistance_band';
			description?: string | null;
			timePerRep?: number | null;
		};
		target: {
			type: 'time' | 'reps';
			value: number;
		};
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
		weight?: number | null;
		weightUnit?: string | null;
		notes?: string | null;
	}

	interface Props {
		movement: MovementInfo;
		index: number;
		isActive: boolean;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
		onRemove?: () => void;
		isFirst?: boolean;
		isLast?: boolean;
	}

	let {
		movement,
		index,
		isActive,
		onMoveUp,
		onMoveDown,
		onRemove,
		isFirst = false,
		isLast = false
	}: Props = $props();

	// Get practice context
	const practice = getContext<ReturnType<typeof usePractice>>('practice');

	let collapsed = $state(false);
	let currentNotes = $state(movement.notes || '');

	$effect(() => {
		if (isActive) {
			collapsed = false;
		}
	});

	$effect(() => {
		currentNotes = movement.notes || '';
	});

	// Generate the list of sets and rests
	function generateItems() {
		const sets = practice.setOverrides[movement.id] ?? movement.sets;
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
			if (movement.isBilateral) {
				// Left side
				result.push({ type: 'set', setNumber: i, side: 'left', key: `${i}L` });

				// Switch sides rest
				if (movement.switchSidesDuration > 0) {
					result.push({
						type: 'rest',
						restType: 'switch-sides',
						duration: movement.switchSidesDuration,
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
			if (i < sets && practice.restDurationValue > 0) {
				result.push({
					type: 'rest',
					restType: 'between-sets',
					duration: practice.restDurationValue,
					label: 'Rest between sets',
					key: `${i}-rest`,
					setNumber: i
				});
			}
		}

		return result;
	}

	const items = $derived(generateItems());

	function getSetKey(setNumber: number, side: 'left' | 'right' | null): string {
		return `${movement.id}-${setNumber}-${side || 'none'}`;
	}

	function isSetCompleted(setNumber: number, side: 'left' | 'right' | null): boolean {
		return practice.completedSets.has(getSetKey(setNumber, side));
	}

	function isSetSkipped(setNumber: number, side: 'left' | 'right' | null): boolean {
		return practice.skippedSets.has(getSetKey(setNumber, side));
	}

	function isSetActive(setNumber: number, side: 'left' | 'right' | null): boolean {
		if (!isActive || practice.showRestTimer) return false;

		const firstIncomplete = items.find(
			(item) =>
				item.type === 'set' &&
				!practice.completedSets.has(`${movement.id}-${item.setNumber}-${item.side || 'none'}`) &&
				!practice.skippedSets.has(`${movement.id}-${item.setNumber}-${item.side || 'none'}`)
		);

		return firstIncomplete?.setNumber === setNumber && firstIncomplete?.side === side;
	}

	function isRestActive(item: any): boolean {
		if (!isActive || !practice.showRestTimer) return false;
		const sideMatch = item.side ? practice.activeRestSide === item.side : !practice.activeRestSide;
		return (
			practice.activeRestType === item.restType &&
			practice.activeRestSetNumber === item.setNumber &&
			sideMatch
		);
	}

	function isRestCompleted(item: any): boolean {
		const itemIndex = items.findIndex((i) => i.key === item.key);
		for (let i = itemIndex + 1; i < items.length; i++) {
			const next = items[i];
			if (next.type === 'set') {
				return isSetCompleted(next.setNumber!, next.side!);
			}
		}
		return false;
	}

	function handleSetComplete(data: any, setNumber: number, side: 'left' | 'right' | null) {
		practice.completeSet({
			...data,
			setNumber,
			side,
			movementIndex: index
		});
	}

	function handleUncompleteSet(data: any, setNumber: number, side: 'left' | 'right' | null) {
		practice.uncompleteSet({
			...data,
			setNumber,
			side,
			routineMovementId: movement.id
		});
	}

	function getSetElementId(setNumber: number, side: 'left' | 'right' | null): string {
		return `set-${getSetKey(setNumber, side)}`;
	}

	function getRestElementId(item: any): string {
		return `rest-${movement.id}-${item.key}`;
	}

	function handleNotesChange(notes: string) {
		currentNotes = notes;
		practice.updateMovementNotes(movement.id, notes);
	}
</script>

<div class="bg-surface border-t-4 border-t-accent-primary mb-4" style="box-shadow: var(--shadow-elevated);">
	<div class="w-full p-4 flex items-start gap-3">
		<div class="flex flex-col items-center flex-shrink-0">
			<button
				onclick={() => onMoveUp?.()}
				disabled={isFirst}
				class="w-10 h-6 flex items-center justify-center bg-surface-elevated text-text-muted hover:bg-accent-track hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
				aria-label="Move up"
				title="Move up"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 mt-0.5">
					<path fill-rule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 4.06l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clip-rule="evenodd" />
				</svg>
			</button>
			<button
				onclick={() => (collapsed = !collapsed)}
				class="w-10 h-10 bg-accent-primary flex items-center justify-center text-sm font-display text-white hover:bg-accent-primary-light transition-colors"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
			>
				{index + 1}
			</button>
			<button
				onclick={() => onMoveDown?.()}
				disabled={isLast}
				class="w-10 h-6 flex items-center justify-center bg-surface-elevated text-text-muted hover:bg-accent-track hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
				aria-label="Move down"
				title="Move down"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
					<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 011.06 1.06l-7.5 7.5z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
		<button
			onclick={() => (collapsed = !collapsed)}
			class="flex-1 min-w-0 text-left hover:bg-surface-elevated transition-colors p-2 -m-2"
		>
			<div class="flex items-center gap-2 flex-wrap">
				<h3 class="font-title font-bold text-text-primary">{movement.movement.name}</h3>
				<span class="inline-flex items-center px-2 py-0.5 text-xs font-body uppercase tracking-wider bg-surface-elevated text-text-secondary border border-accent-track">
					{movement.movement.type}
				</span>
				{#if movement.isBilateral}
					<span class="inline-flex items-center px-2 py-0.5 text-xs font-body uppercase tracking-wider bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
						L/R
					</span>
				{/if}
			</div>
			{#if movement.movement.description}
				<p class="text-text-secondary text-sm mt-1 line-clamp-2 font-body">{movement.movement.description}</p>
			{/if}
		</button>
		<div class="flex items-center gap-1 flex-shrink-0">
			<button
				onclick={() => onRemove?.()}
				class="w-8 h-8 flex items-center justify-center text-text-secondary hover:bg-error/20 hover:text-error transition-colors"
				aria-label="Remove movement"
				title="Remove movement"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
			<button
				onclick={() => (collapsed = !collapsed)}
				class="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="w-5 h-5 transition-transform {collapsed ? 'rotate-180' : ''}"
				>
					<path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 011.06 1.06l-7.5 7.5z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
	</div>

	{#if !collapsed}
		<div class="border-t border-accent-track p-2 space-y-2">
			<!-- Notes Section -->
			<div class="px-2 pb-2 mb-2 border-b border-accent-track">
				<div class="mb-2 flex items-center gap-2">
					<span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Notes</span>
					{#if practice.notesSavingStates[movement.id]}
						<svg
							class="animate-spin h-3 w-3 text-accent-primary"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
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
					class="w-full bg-inset border-2 border-accent-track text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-accent-primary resize-none placeholder:text-text-muted font-body"
					placeholder="Add notes about this movement..."
					aria-label="Movement notes"
				></textarea>
			</div>

			<!-- Set Controller (Adjust Sets) -->
			<div class="px-2 pb-2 mb-2 flex items-center justify-between border-b border-accent-track">
				<span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Adjust Sets</span>
				<div class="flex items-center gap-3">
					<button
						onclick={() => practice.adjustSets(movement.id, 'down')}
						disabled={practice.isAdjustingSets[movement.id] || (practice.setOverrides[movement.id] ?? movement.sets) <= 1}
						class="w-8 h-8 flex items-center justify-center bg-surface-elevated border border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary disabled:opacity-50 transition-colors"
						aria-label="Remove set"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
						</svg>
					</button>
					<span class="text-sm font-bold text-accent-primary min-w-[3rem] text-center font-display">
						{practice.setOverrides[movement.id] ?? movement.sets} Sets
					</span>
					<button
						onclick={() => practice.adjustSets(movement.id, 'up')}
						disabled={practice.isAdjustingSets[movement.id]}
						class="w-8 h-8 flex items-center justify-center bg-surface-elevated border border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary disabled:opacity-50 transition-colors"
						aria-label="Add set"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
					</button>
				</div>
			</div>

			{#each items as item (item.key)}
				{#if item.type === 'set'}
					{@const isCompleted = isSetCompleted(item.setNumber!, item.side!)}
					{@const isSkipped = isSetSkipped(item.setNumber!, item.side!)}
					{@const active = isSetActive(item.setNumber!, item.side!)}
					{@const showTimer = active && movement.movement.type === 'timed' && practice.activeSetTimerValue > 0}
					{@const setKey = getSetKey(item.setNumber!, item.side!)}
					{@const completedValue = practice.completedValues?.[setKey]}
					<SetRow
						id={getSetElementId(item.setNumber!, item.side!)}
						setNumber={item.setNumber!}
						movementType={movement.movement.type}
						targetValue={movement.target.value}
						weight={movement.weight}
						weightUnit={movement.weightUnit}
						timePerRep={movement.movement.timePerRep}
						isBilateral={movement.isBilateral}
						side={item.side!}
						isActive={active}
						isCompleted={isCompleted}
						isSkipped={isSkipped}
						{completedValue}
						activeSetTimer={showTimer ? practice.activeSetTimerValue : 0}
						activeSetTimerPaused={practice.activeSetTimerPaused}
						onToggleTimerPaused={showTimer ? () => practice.toggleActiveSetTimerPaused() : undefined}
						onResetTimer={showTimer ? () => practice.resetActiveSetTimer() : undefined}
						isCompleting={practice.isCompletingSet}
						onComplete={(data) => handleSetComplete(data, item.setNumber!, item.side!)}
						onUncomplete={(data) => handleUncompleteSet(data, item.setNumber!, item.side!)}
						onSkip={active ? () => practice.skipSet() : undefined}
						isPaused={practice.isPaused}
						isInRestPeriod={practice.isInRestPeriod}
						onRepIncrement={() => practice.playRepSound()}
					/>
				{:else}
					{@const active = isRestActive(item)}
					{@const completed = isRestCompleted(item)}
					<RestRow
						id={getRestElementId(item)}
						label={item.label}
						duration={item.duration!}
						remainingTime={active ? practice.restTimerValue : item.duration}
						isActive={active}
						isCompleted={completed}
						onSkip={active ? () => practice.skipRest() : undefined}
						isPaused={practice.isPaused}
					/>
				{/if}
			{/each}
		</div>
	{/if}
</div>
