<script lang="ts">
	import { getContext } from 'svelte';
	import { Info } from 'phosphor-svelte';
	import SetRow from './SetRow.svelte';
	import RestRow from './RestRow.svelte';
	import type { PracticeSession, MovementSnapshot } from '$lib/composables/PracticeSession.svelte';

	interface Props {
		movement: MovementSnapshot;
		isActive: boolean;
		isFirst?: boolean;
		isLast?: boolean;
		onMoveUp?: () => void;
		onMoveDown?: () => void;
		onRemove?: () => void;
		onAdjustSets?: (delta: number) => void;
		onNotesChange?: (notes: string) => void;
		onRepIncrement?: () => void;
		onShowDetails?: () => void;
	}

	let {
		movement,
		isActive,
		isFirst = false,
		isLast = false,
		onMoveUp,
		onMoveDown,
		onRemove,
		onAdjustSets,
		onNotesChange,
		onRepIncrement,
		onShowDetails,
	}: Props = $props();

	const session = getContext<PracticeSession>('practice');

	const liveMovement = $derived(session.movements.find((m) => m.id === movement.id) ?? movement);

	let collapsed = $state(false);
	let currentNotes = $state('');

	$effect(() => {
		if (isActive) collapsed = false;
	});

	$effect(() => {
		currentNotes = movement.notes || '';
	});

	// Generate the list of sets and rests
	function generateItems() {
		const m = liveMovement;
		const result: Array<{
			type: 'set' | 'rest';
			setNumber?: number;
			side?: 'left' | 'right' | null;
			restType?: 'switch-sides' | 'between-sets';
			duration?: number;
			label?: string;
			key: string;
		}> = [];

		for (let i = 1; i <= m.sets; i++) {
			if (m.isBilateral) {
				result.push({ type: 'set', setNumber: i, side: 'left', key: `${i}L` });

				if (m.switchSidesDuration > 0) {
					result.push({
						type: 'rest',
						restType: 'switch-sides',
						duration: m.switchSidesDuration,
						label: 'Switch Sides',
						key: `${i}-switch`,
						setNumber: i,
						side: 'left'
					});
				}

				result.push({ type: 'set', setNumber: i, side: 'right', key: `${i}R` });
			} else {
				result.push({ type: 'set', setNumber: i, side: null, key: `${i}` });
			}

			if (i < m.sets) {
				result.push({
					type: 'rest',
					restType: 'between-sets',
					duration: session.restBetweenSets,
					label: 'Rest between sets',
					key: `${i}-rest`,
					setNumber: i
				});
			}
		}

		return result;
	}

	const items = $derived(generateItems());

	function isRestActive(item: any): boolean {
		if (!isActive) return false;
		const restInfo = session.timer.restInfo;
		if (!restInfo) return false;

		// Check if this specific rest item matches the active rest
		if (item.restType === 'switch-sides') {
			return restInfo.type === 'switch-sides' && item.setNumber === session.findNextIncompleteSet()?.setNumber;
		}
		if (item.restType === 'between-sets') {
			const next = session.findNextIncompleteSet();
			if (!next || next.movementId !== movement.id) return false;
			// The active between-sets rest is the one after the set just completed
			return restInfo.type === 'between-sets' && item.setNumber === next.setNumber - 1;
		}
		return false;
	}

	function isRestCompleted(item: any): boolean {
		const itemIndex = items.findIndex((i) => i.key === item.key);
		for (let i = itemIndex + 1; i < items.length; i++) {
			const next = items[i];
			if (next.type === 'set') {
				return session.isSetCompleted(movement.id, next.setNumber!, next.side!);
			}
		}
		return false;
	}

	function handleNotesChange(notes: string) {
		currentNotes = notes;
		onNotesChange?.(notes);
	}
</script>

<div class="bg-surface border-t-4 border-t-accent-primary mb-4" style="box-shadow: var(--shadow-elevated);">
	<div class="w-full p-4 flex items-start gap-3">
		<!-- Mobile-only order badge (also tap target for collapse) -->
		<button
			onclick={() => (collapsed = !collapsed)}
			class="sm:hidden w-10 h-10 bg-accent-primary flex items-center justify-center text-sm font-display text-white hover:bg-accent-primary-light transition-colors flex-shrink-0"
			aria-label={collapsed ? 'Expand' : 'Collapse'}
		>
			{movement.order + 1}
		</button>

		<div class="hidden sm:flex flex-col items-center flex-shrink-0">
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
				{movement.order + 1}
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
				<h3 class="font-title font-bold text-text-primary">{movement.name}</h3>
				<span class="inline-flex items-center px-2 py-0.5 text-xs font-body uppercase tracking-wider bg-surface-elevated text-text-secondary border border-accent-track">
					{movement.type}
				</span>
				{#if movement.isBilateral}
					<span class="inline-flex items-center px-2 py-0.5 text-xs font-body uppercase tracking-wider bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
						L/R
					</span>
				{/if}
			</div>
		</button>
		<div class="flex items-center gap-1 flex-shrink-0">
			{#if onShowDetails}
				<button
					onclick={() => onShowDetails()}
					class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent-primary hover:bg-surface-elevated transition-colors"
					aria-label="Show movement details"
					title="Show movement details"
				>
					<Info weight="duotone" size={18} />
				</button>
			{/if}
			<button
				onclick={() => onRemove?.()}
				class="hidden sm:flex w-8 h-8 items-center justify-center text-text-secondary hover:bg-error/20 hover:text-error transition-colors"
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
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 transition-transform {collapsed ? 'rotate-180' : ''}">
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
						onclick={() => onAdjustSets?.(-1)}
						disabled={movement.sets <= 1}
						class="min-h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center bg-surface-elevated border border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary disabled:opacity-50 transition-colors"
						aria-label="Remove set"
					>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
						</svg>
					</button>
				<span class="text-sm font-bold text-accent-primary min-w-[3rem] text-center font-display">
					{liveMovement.sets} Sets
				</span>
					<button
						onclick={() => onAdjustSets?.(1)}
						class="min-h-11 w-11 sm:h-9 sm:w-9 flex items-center justify-center bg-surface-elevated border border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary disabled:opacity-50 transition-colors"
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
					<SetRow
						id="set-{movement.id}-{item.setNumber}-{item.side || 'none'}"
						setNumber={item.setNumber!}
						movementId={movement.id}
						movementType={movement.type}
						targetValue={movement.target.value}
						weight={movement.weight}
						weightUnit={movement.weightUnit}
						isBilateral={movement.isBilateral}
						side={item.side!}
						isActive={isActive && session.isSetActive(movement.id, item.setNumber!, item.side!)}
						isCompleted={session.isSetCompleted(movement.id, item.setNumber!, item.side!)}
						isSkipped={session.isSetSkipped(movement.id, item.setNumber!, item.side!)}
						completedValue={session.getSetRecord(movement.id, item.setNumber!, item.side!)?.value ?? null}
						timePerRep={movement.timePerRep}
						onComplete={(data) => session.completeSet(movement.id, item.setNumber!, item.side!, data.value, { weight: data.weight, weightUnit: data.weightUnit, rating: data.rating })}
						onUncomplete={() => session.uncompleteSet(movement.id, item.setNumber!, item.side!)}
						onSkip={() => session.skipSet(movement.id, item.setNumber!, item.side!)}
						onRepIncrement={() => onRepIncrement?.()}
						isPaused={session.timer.isPaused}
						isInRestPeriod={session.timer.state === 'rest' || session.timer.state === 'switchSides'}
					/>
				{:else}
					{@const active = isRestActive(item)}
					{@const completed = isRestCompleted(item)}
					<RestRow
						label={item.label}
						duration={item.duration!}
						remainingTime={active ? (session.timer.restInfo?.remaining ?? item.duration!) : item.duration!}
						isActive={active}
						isCompleted={completed}
						onSkip={active ? () => session.skipRest() : undefined}
						isPaused={session.timer.isPaused}
					/>
				{/if}
			{/each}
		</div>
	{/if}
</div>
