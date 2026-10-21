<script lang="ts">
	import { formatDuration, calculateRoutineDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import PageHeader from '../../../components/ui/PageHeader.svelte';
	import { goto } from '$app/navigation';
	import { nanoid } from 'nanoid';
	import {
		ArrowLeft,
		PencilSimple,
		Play,
		Clock,
		Stack,
		ArrowsLeftRight,
		Barbell,
		Timer,
		PersonSimple,
		SpeakerHigh,
		Sun,
		Lightning,
		CaretRight,
		CaretUp,
		CaretDown,
		Trash,
		Info,
		SlidersHorizontal,
		Plus,
		Minus,
		ArrowCounterClockwise,
		Check,
	} from 'phosphor-svelte';
	import MovementDetailModal from '../../../components/practice/MovementDetailModal.svelte';
	import AddMovementModal from '../../../components/practice/AddMovementModal.svelte';

	let { data }: { data: PageData } = $props();

	let selectedMovement = $state<any>(null);
	let isCustomizing = $state(false);
	let showAddModal = $state(false);

	interface CustomMovementItem {
		id: string;
		movementId: string;
		order: number;
		sets: number;
		target: { type: 'time' | 'reps'; value: number; unit?: string };
		isBilateral: boolean;
		switchSidesDuration: number;
		weight: number | null;
		weightUnit: string | null;
		notes: string | null;
		movement: any;
	}

	function cloneInitialMovements(): CustomMovementItem[] {
		return data.routine.movements.map((rm: any, index: number) => ({
			id: rm.id,
			movementId: rm.movementId,
			order: index,
			sets: rm.sets,
			target: { ...rm.target },
			isBilateral: rm.isBilateral,
			switchSidesDuration: rm.switchSidesDuration ?? 5,
			weight: rm.weight ?? null,
			weightUnit: rm.weightUnit ?? 'kg',
			notes: rm.notes ?? null,
			movement: rm.movement,
		}));
	}

	let currentMovements = $state<CustomMovementItem[]>(cloneInitialMovements());

	// Derived flag if user has made structural or target changes
	const hasChanges = $derived.by(() => {
		if (currentMovements.length !== data.routine.movements.length) return true;
		for (let i = 0; i < currentMovements.length; i++) {
			const cur = currentMovements[i];
			const orig = data.routine.movements[i];
			if (cur.movementId !== orig.movementId) return true;
			if (cur.sets !== orig.sets) return true;
			if (cur.target?.value !== orig.target?.value) return true;
			if (cur.target?.type !== orig.target?.type) return true;
			if (cur.weight !== orig.weight) return true;
		}
		return false;
	});

	function resetToOriginal() {
		currentMovements = cloneInitialMovements();
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...currentMovements];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		currentMovements = next.map((m, i) => ({ ...m, order: i }));
	}

	function moveDown(index: number) {
		if (index >= currentMovements.length - 1) return;
		const next = [...currentMovements];
		[next[index + 1], next[index]] = [next[index], next[index + 1]];
		currentMovements = next.map((m, i) => ({ ...m, order: i }));
	}

	function adjustSets(index: number, delta: number) {
		const next = [...currentMovements];
		const updated = Math.max(1, next[index].sets + delta);
		next[index] = { ...next[index], sets: updated };
		currentMovements = next;
	}

	function adjustTarget(index: number, delta: number) {
		const next = [...currentMovements];
		const item = next[index];
		const step = item.target.type === 'time' ? 5 : 1;
		const currentVal = item.target.value || 0;
		const updated = Math.max(step, currentVal + delta * step);
		next[index] = {
			...item,
			target: {
				...item.target,
				value: updated,
			},
		};
		currentMovements = next;
	}

	function removeMovement(index: number) {
		if (currentMovements.length <= 1) {
			alert('Routine must have at least one exercise.');
			return;
		}
		currentMovements = currentMovements
			.filter((_, i) => i !== index)
			.map((m, i) => ({ ...m, order: i }));
	}

	function handleAddMovement(movementId: string) {
		const movement = data.allMovements?.find((m: any) => m.id === movementId);
		if (!movement) return;
		const newRm: CustomMovementItem = {
			id: nanoid(),
			movementId: movement.id,
			order: currentMovements.length,
			sets: 3,
			target: {
				type: movement.type === 'timed' ? 'time' : 'reps',
				value: movement.type === 'timed' ? 30 : 10,
				unit: movement.type === 'timed' ? 's' : 'reps',
			},
			isBilateral: movement.isBilateral ?? false,
			switchSidesDuration: 5,
			weight: null,
			weightUnit: 'kg',
			notes: null,
			movement,
		};
		currentMovements = [...currentMovements, newRm];
		showAddModal = false;
	}

	function getSerializedSnapshots() {
		return currentMovements.map((rm, idx) => ({
			id: rm.id,
			movementId: rm.movementId,
			name: rm.movement.name,
			type: rm.movement.type,
			target: rm.target,
			sets: rm.sets,
			isBilateral: rm.isBilateral,
			switchSidesDuration: rm.switchSidesDuration || 5,
			weight: rm.weight,
			weightUnit: rm.weightUnit,
			timePerRep: rm.movement.timePerRep,
			notes: rm.notes,
			order: idx,
		}));
	}

	function showMovementDetail(movement: any) {
		selectedMovement = movement;
	}

	function closeMovementDetail() {
		selectedMovement = null;
	}

	const totalSets = $derived(
		currentMovements.reduce((sum: number, rm: any) => {
			return sum + (rm.isBilateral ? rm.sets * 2 : rm.sets);
		}, 0)
	);

	const totalMovements = $derived(currentMovements.length);

	const dynamicDuration = $derived(
		calculateRoutineDuration(
			currentMovements.map((rm) => ({
				target: rm.target,
				sets: rm.sets,
				isBilateral: rm.isBilateral,
				switchSidesDuration: rm.switchSidesDuration,
				timePerRep: rm.movement.timePerRep,
			})),
			data.routine.restBetweenMovements,
			data.routine.restBetweenSets
		)
	);

	function handleBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/routines');
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'timed': return Timer;
			case 'reps': return Stack;
			case 'weighted': return Barbell;
			default: return PersonSimple;
		}
	}

	function getTypeLabel(type: string) {
		switch (type) {
			case 'timed': return 'Timed';
			case 'reps': return 'Reps';
			case 'weighted': return 'Weighted';
			case 'count': return 'Count';
			case 'distance': return 'Distance';
			default: return type;
		}
	}

	function formatTarget(rm: any) {
		if (!rm.target?.value) return null;
		const unit = rm.target.unit || '';
		return `${rm.target.value} ${unit}`;
	}

	function formatWeight(rm: any) {
		if (!rm.weight) return null;
		return `${rm.weight} ${rm.weightUnit || 'kg'}`;
	}
</script>

<svelte:head>
	<title>{data.routine.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary pb-32">
	<PageHeader user={data.user} showNav={false}>
		<div class="flex items-center gap-3">
			{#if data.user && data.user.id === data.routine.userId}
				<a
					href="/routine/{data.routine.id}/edit"
					class="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated text-text-primary transition-colors border border-accent-track hover:border-accent-primary"
				>
					<PencilSimple weight="bold" size={14} class="text-accent-primary" />
					<span class="font-body text-sm uppercase tracking-wider hidden sm:inline">Edit</span>
				</a>
				<form 
					method="POST" 
					action="?/deleteRoutine" 
					use:enhance
					class="inline-flex"
					onsubmit={(e) => {
						if (!confirm('Are you sure you want to delete this routine? This action cannot be undone.')) {
							e.preventDefault();
						}
					}}
				>
					<button
						type="submit"
						class="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-error/10 text-text-secondary hover:text-error transition-colors border border-accent-track hover:border-error"
					>
						<Trash weight="bold" size={14} class="text-error" />
						<span class="font-body text-sm uppercase tracking-wider hidden sm:inline">Delete</span>
					</button>
				</form>
			{/if}
			<button
				onclick={handleBack}
				class="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors border border-accent-track"
			>
				<ArrowLeft weight="bold" size={16} />
				<span class="font-body text-sm hidden sm:inline">Back</span>
			</button>
		</div>
	</PageHeader>

	<main class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<!-- Hero Section -->
		<section class="mb-8 pb-6 border-b-2 border-accent-track">
			<div class="flex items-baseline gap-4 mb-3">
				<span class="text-text-muted text-sm uppercase tracking-widest font-body">Routine</span>
				<div class="flex-1 h-px bg-accent-track"></div>
				{#if data.routine.isCustom}
					<span class="shrink-0 px-2 py-0.5 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary font-mono text-xs">CUSTOM</span>
				{/if}
			</div>
			<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none mb-4">
				{data.routine.name.toUpperCase()}
			</h1>
			{#if data.routine.description}
				<p class="font-body text-text-secondary text-lg leading-relaxed max-w-2xl">
					{data.routine.description}
				</p>
			{/if}
		</section>

		<!-- Stats Grid -->
		<section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="bg-surface p-4 border-t-4 border-t-accent-primary" style="box-shadow: var(--shadow-elevated);">
				<div class="flex items-center gap-2 mb-2">
					<Clock weight="duotone" size={18} class="text-accent-primary" />
					<span class="font-body text-text-muted text-xs uppercase tracking-wider">Duration</span>
				</div>
				<div class="flex items-baseline gap-1">
					<span class="font-display text-3xl text-accent-primary">
						{#if dynamicDuration}
							{dynamicDuration >= 60 ? Math.round(dynamicDuration / 60) : dynamicDuration}
						{:else}
							--
						{/if}
					</span>
					<span class="font-mono text-sm text-text-muted">{dynamicDuration && dynamicDuration >= 60 ? 'min' : 's'}</span>
				</div>
			</div>

			<div class="bg-surface p-4 border-t-4 border-t-accent-secondary" style="box-shadow: var(--shadow-elevated);">
				<div class="flex items-center gap-2 mb-2">
					<Stack weight="duotone" size={18} class="text-accent-secondary" />
					<span class="font-body text-text-muted text-xs uppercase tracking-wider">Total Sets</span>
				</div>
				<div class="flex items-baseline gap-1">
					<span class="font-display text-3xl text-accent-secondary">{totalSets}</span>
					<span class="font-mono text-sm text-text-muted">sets</span>
				</div>
			</div>

			<div class="bg-surface p-4 border-t-4 border-t-accent-warm" style="box-shadow: var(--shadow-elevated);">
				<div class="flex items-center gap-2 mb-2">
					<Timer weight="duotone" size={18} class="text-accent-warm" />
					<span class="font-body text-text-muted text-xs uppercase tracking-wider">Rest (Sets)</span>
				</div>
				<div class="flex items-baseline gap-1">
					<span class="font-display text-3xl text-accent-warm">{data.routine.restBetweenSets}</span>
					<span class="font-mono text-sm text-text-muted">s</span>
				</div>
			</div>

			<div class="bg-surface p-4 border-t-4 border-t-accent-cream" style="box-shadow: var(--shadow-elevated);">
				<div class="flex items-center gap-2 mb-2">
					<ArrowsLeftRight weight="duotone" size={18} class="text-accent-cream" />
					<span class="font-body text-text-muted text-xs uppercase tracking-wider">Rest (Mvmt)</span>
				</div>
				<div class="flex items-baseline gap-1">
					<span class="font-display text-3xl text-accent-cream">{data.routine.restBetweenMovements}</span>
					<span class="font-mono text-sm text-text-muted">s</span>
				</div>
			</div>
		</section>

		<!-- Settings Tags -->
		<section class="flex flex-wrap gap-2 mb-8">
			{#if data.routine.autoAdvance}
				<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-sm">
					<Lightning weight="duotone" size={14} />
					<span class="font-mono text-xs uppercase tracking-wider">Auto-Play</span>
				</span>
			{/if}
			{#if data.routine.audioEnabled}
				<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-accent-track text-text-secondary text-sm">
					<SpeakerHigh weight="duotone" size={14} class="text-accent-secondary" />
					<span class="font-mono text-xs uppercase tracking-wider">Audio</span>
				</span>
			{/if}
			{#if data.routine.keepAwake}
				<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-warm/10 border border-accent-warm/30 text-accent-warm text-sm">
					<Sun weight="duotone" size={14} />
					<span class="font-mono text-xs uppercase tracking-wider">Keep Awake</span>
				</span>
			{/if}
			{#if data.equipment && data.equipment.length > 0}
				{#each data.equipment as item}
					<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent-track text-text-secondary text-sm">
						<Barbell weight="duotone" size={14} class="text-text-muted" />
						<span class="font-body text-sm">{item}</span>
					</span>
				{/each}
			{/if}
		</section>

		<!-- Timeline Section -->
		<section class="mb-8">
			<div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
				<div class="flex items-baseline gap-4">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">TIMELINE</h2>
					<span class="font-mono text-sm text-text-muted">{totalMovements} movements</span>
				</div>
				<div class="flex items-center gap-2">
					{#if !isCustomizing}
						<button
							onclick={() => (isCustomizing = true)}
							class="inline-flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-elevated text-text-primary transition-colors border border-accent-track hover:border-accent-primary font-body text-xs uppercase tracking-wider"
						>
							<SlidersHorizontal weight="bold" size={14} class="text-accent-primary" />
							<span>Customize for Today</span>
						</button>
					{:else}
						{#if hasChanges}
							<button
								onclick={resetToOriginal}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors border border-accent-track font-body text-xs uppercase tracking-wider"
								title="Reset routine back to default"
							>
								<ArrowCounterClockwise weight="bold" size={14} />
								<span>Reset</span>
							</button>
						{/if}
						<button
							onclick={() => (isCustomizing = false)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white hover:bg-accent-primary-light transition-colors font-body text-xs uppercase tracking-wider"
						>
							<Check weight="bold" size={14} />
							<span>Done</span>
						</button>
					{/if}
				</div>
			</div>

			{#if hasChanges}
				<div class="mb-6 p-4 bg-accent-secondary/10 border-l-4 border-accent-secondary flex items-center justify-between gap-3 text-xs font-mono">
					<div class="flex items-center gap-2 text-accent-secondary">
						<SlidersHorizontal weight="bold" size={14} />
						<span>Customized for this session only (you can save or discard changes when finished).</span>
					</div>
					{#if !isCustomizing}
						<button onclick={resetToOriginal} class="text-text-muted hover:text-text-primary underline uppercase tracking-wider">
							Reset
						</button>
					{/if}
				</div>
			{/if}

			<div class="space-y-4">
				{#each currentMovements as rm, index (rm.id)}
					{@const TypeIcon = getTypeIcon(rm.movement.type)}
					<div class="group relative bg-surface border-t-4 border-t-accent-primary hover:-translate-y-0.5 transition-all duration-200" style="box-shadow: var(--shadow-elevated);">
						<!-- Blue glow on hover -->
						<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="box-shadow: inset 0 0 30px rgba(91, 141, 184, 0.1);"></div>
						
						<div class="p-5">
							<div class="flex items-start gap-4">
								<!-- Index Badge & Reordering -->
								<div class="flex flex-col items-center gap-1 shrink-0">
									{#if isCustomizing}
										<button
											onclick={() => moveUp(index)}
											disabled={index === 0}
											class="w-6 h-5 flex items-center justify-center bg-surface-elevated hover:bg-surface text-text-muted hover:text-accent-primary disabled:opacity-20 disabled:pointer-events-none transition-colors border border-accent-track"
											aria-label="Move up"
										>
											<CaretUp weight="bold" size={12} />
										</button>
									{/if}
									<div class="w-12 h-12 bg-surface-elevated flex items-center justify-center shrink-0">
										<span class="font-mono text-lg text-accent-primary">{String(index + 1).padStart(2, '0')}</span>
									</div>
									{#if isCustomizing}
										<button
											onclick={() => moveDown(index)}
											disabled={index === currentMovements.length - 1}
											class="w-6 h-5 flex items-center justify-center bg-surface-elevated hover:bg-surface text-text-muted hover:text-accent-primary disabled:opacity-20 disabled:pointer-events-none transition-colors border border-accent-track"
											aria-label="Move down"
										>
											<CaretDown weight="bold" size={12} />
										</button>
									{/if}
								</div>

								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-3 mb-3">
										<div>
											<div class="flex items-center gap-2">
												<h3 class="font-title text-xl text-text-primary group-hover:text-accent-primary transition-colors leading-tight">
													{rm.movement.name}
												</h3>
												<button
													onclick={() => showMovementDetail(rm.movement)}
													class="p-1 text-text-muted hover:text-accent-primary transition-colors shrink-0"
													aria-label="Show movement details"
													title="Show movement details"
												>
													<Info weight="duotone" size={16} />
												</button>
											</div>
											<div class="flex items-center gap-2 text-text-muted text-sm">
												<TypeIcon weight="duotone" size={14} class="text-accent-primary" />
												<span class="font-body capitalize">{getTypeLabel(rm.movement.type)}</span>
											</div>
										</div>

										<!-- Tags & Actions -->
										<div class="flex items-center gap-2 shrink-0">
											{#if rm.isBilateral}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-secondary/10 text-accent-secondary text-xs font-mono">
													<ArrowsLeftRight weight="bold" size={10} />
													L/R
												</span>
											{/if}

											{#if isCustomizing}
												<!-- Sets Stepper -->
												<div class="flex items-center bg-surface-elevated border border-accent-track">
													<button
														onclick={() => adjustSets(index, -1)}
														class="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
														aria-label="Decrease sets"
													>
														<Minus weight="bold" size={11} />
													</button>
													<span class="px-2 text-xs font-mono text-text-primary min-w-[3.5rem] text-center">
														{rm.sets} {rm.sets === 1 ? 'set' : 'sets'}
													</span>
													<button
														onclick={() => adjustSets(index, 1)}
														class="w-7 h-7 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
														aria-label="Increase sets"
													>
														<Plus weight="bold" size={11} />
													</button>
												</div>

												<!-- Remove Movement Button -->
												<button
													onclick={() => removeMovement(index)}
													class="p-1.5 text-text-muted hover:text-accent-warm hover:bg-surface-elevated transition-colors"
													aria-label="Remove exercise from session"
													title="Remove exercise from session"
												>
													<Trash weight="bold" size={16} />
												</button>
											{:else}
												<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-elevated text-text-muted text-xs font-mono">
													<Stack weight="bold" size={10} />
													{rm.sets} sets
												</span>
											{/if}
										</div>
									</div>

									<!-- Target Info -->
									{#if formatTarget(rm)}
										<div class="flex items-center gap-4 mb-3">
											<div class="flex items-center gap-2">
												<div class="flex items-baseline gap-1">
													<span class="font-display text-2xl text-accent-primary">{rm.target.value}</span>
													<span class="font-mono text-xs text-text-muted">{rm.target.unit || ''}</span>
													<span class="font-body text-xs text-text-muted uppercase tracking-wider ml-1">target</span>
												</div>
												{#if isCustomizing}
													<div class="flex items-center bg-surface-elevated border border-accent-track ml-2">
														<button
															onclick={() => adjustTarget(index, -1)}
															class="w-6 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
															aria-label="Decrease target"
														>
															<Minus weight="bold" size={10} />
														</button>
														<button
															onclick={() => adjustTarget(index, 1)}
															class="w-6 h-6 flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors"
															aria-label="Increase target"
														>
															<Plus weight="bold" size={10} />
														</button>
													</div>
												{/if}
											</div>
											{#if formatWeight(rm)}
												<div class="w-px h-6 bg-accent-track"></div>
												<div class="flex items-baseline gap-1">
													<span class="font-display text-lg text-accent-warm">{rm.weight}</span>
													<span class="font-mono text-xs text-text-muted">{rm.weightUnit || 'kg'}</span>
												</div>
											{/if}
										</div>
									{/if}

									<!-- Notes -->
									{#if rm.notes}
										<p class="font-body text-text-secondary text-sm leading-relaxed bg-surface-elevated p-3 border-l-2 border-accent-track">
											{rm.notes}
										</p>
									{/if}

									<!-- Bilateral Info -->
									{#if rm.isBilateral && rm.switchSidesDuration}
										<div class="flex items-center gap-2 mt-3 text-text-muted text-sm">
											<ArrowsLeftRight weight="duotone" size={14} class="text-accent-warm" />
											<span class="font-body">Switch sides: <span class="font-mono text-accent-warm">{rm.switchSidesDuration}s</span></span>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}

				{#if isCustomizing}
					<button
						onclick={() => (showAddModal = true)}
						class="w-full py-4 border-2 border-dashed border-accent-track hover:border-accent-primary hover:bg-surface transition-all flex items-center justify-center gap-2 text-text-secondary hover:text-accent-primary font-title uppercase tracking-wider text-sm mt-4"
					>
						<Plus weight="bold" size={16} />
						<span>Add Exercise to Today's Session</span>
					</button>
				{/if}
			</div>
		</section>

		<!-- Bottom Actions -->
		<section class="pt-6 border-t-2 border-accent-track">
			<div class="flex items-center justify-between">
				<button
					onclick={handleBack}
					class="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors font-body uppercase tracking-wider text-sm"
				>
				<ArrowLeft weight="bold" size={14} />
					Back to Routines
				</button>

				{#if data.user && data.user.id === data.routine.userId}
					<a
						href="/routine/{data.routine.id}/edit"
						class="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white hover:bg-accent-primary-light transition-colors font-display text-lg tracking-widest"
					>
						<PencilSimple weight="bold" size={18} />
						EDIT ROUTINE
					</a>
				{/if}
			</div>
		</section>
	</main>

	<!-- Fixed bottom Start Practice button -->
	<div class="fixed bottom-0 left-0 right-0 p-6 bg-base/95 border-t-2 border-accent-track backdrop-blur-sm z-30">
		<div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
			<form method="POST" action="?/startPractice" use:enhance>
				{#if hasChanges}
					<input type="hidden" name="customMovements" value={JSON.stringify(getSerializedSnapshots())} />
				{/if}
				<button
					type="submit"
					class="group w-full bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 h-16 font-display text-xl tracking-widest flex items-center justify-center gap-3"
					style="box-shadow: var(--shadow-floating);"
				>
					<Play weight="fill" size={24} class="group-hover:scale-110 transition-transform" />
					{#if hasChanges}
						START CUSTOM PRACTICE
					{:else}
						START PRACTICE
					{/if}
					<CaretRight weight="bold" size={20} />
				</button>
			</form>
		</div>
	</div>

	<!-- Footer (add padding to clear fixed button) -->
	<footer class="border-t-2 border-accent-track mt-8 mb-24">
		<div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
			<p class="text-text-muted text-sm text-center font-body">
				STRTCHY — MOVE BETTER
			</p>
		</div>
	</footer>

	<MovementDetailModal
		movement={selectedMovement}
		isOpen={selectedMovement !== null}
		onClose={closeMovementDetail}
	/>

	<AddMovementModal
		isOpen={showAddModal}
		isLoading={false}
		isPaused={false}
		groupedMovements={(data.groupedMovements as any) || { Timed: [], Repetitions: [], Weighted: [], "Resistance Band": [] }}
		onAdd={(movementId) => handleAddMovement(movementId)}
		onClose={() => (showAddModal = false)}
	/>
</div>

<style>
	:global(body) {
		background: var(--color-base);
	}
</style>
