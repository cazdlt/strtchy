<script lang="ts">
	import { formatDuration, getRelativeTime, formatTime } from '$lib/utils/formatting';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Group practice data by movement
	const grouped = $derived.by(() => {
		const map = new Map<string, typeof data.practiceData>();
		for (const pd of data.practiceData) {
			const key = pd.movementId;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(pd);
		}
		return map;
	});

	const movements = $derived.by(() => {
		const result: Array<{
			movementId: string;
			name: string;
			type: string;
			sets: typeof data.practiceData;
		}> = [];
		for (const [movementId, sets] of grouped) {
			if (sets.length > 0) {
				result.push({
					movementId,
					name: sets[0].movementName,
					type: sets[0].movementType,
					sets,
				});
			}
		}
		return result;
	});

	const completedSets = $derived(data.practiceData.filter(pd => pd.status !== 'skipped').length);
	const skippedSets = $derived(data.practiceData.filter(pd => pd.status === 'skipped').length);
</script>

<svelte:head>
	<title>Practice Summary - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary">
	<header class="p-6 border-b border-accent-track">
		<div class="max-w-4xl mx-auto">
			<a href="/routine/{data.practice.routineId}" class="text-text-secondary hover:text-text-primary text-sm mb-2 inline-block font-body uppercase tracking-wider">&larr; Start Again</a>
			<h1 class="text-3xl font-display text-text-primary tracking-wide">Practice Complete!</h1>
			<p class="text-text-secondary mt-2 font-body">{data.practice.routine.name}</p>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-6">
		<!-- Stats -->
		<div class="grid grid-cols-2 gap-4 mb-8">
			<div class="bg-surface border-t-4 border-t-accent-primary p-6" style="box-shadow: var(--shadow-elevated);">
				<p class="text-text-muted text-sm mb-1 font-body uppercase tracking-wider">Duration</p>
				<p class="text-2xl font-display text-text-primary">
					{data.practice.duration ? formatDuration(data.practice.duration) : 'In progress'}
				</p>
			</div>
			<div class="bg-surface border-t-4 border-t-accent-primary p-6" style="box-shadow: var(--shadow-elevated);">
				<p class="text-text-muted text-sm mb-1 font-body uppercase tracking-wider">Completed At</p>
				<p class="text-2xl font-display text-text-primary">
					{data.practice.completedAt ? getRelativeTime(data.practice.completedAt) : 'N/A'}
				</p>
			</div>
		</div>

		<!-- Summary stats -->
		<div class="grid grid-cols-3 gap-4 mb-6">
			<div class="bg-surface border-t-4 border-t-success p-4 text-center" style="box-shadow: var(--shadow-elevated);">
				<p class="text-3xl font-display text-success">{completedSets}</p>
				<p class="text-xs text-text-muted font-body uppercase tracking-wider">Completed</p>
			</div>
			<div class="bg-surface border-t-4 border-t-warning p-4 text-center" style="box-shadow: var(--shadow-elevated);">
				<p class="text-3xl font-display text-warning">{skippedSets}</p>
				<p class="text-xs text-text-muted font-body uppercase tracking-wider">Skipped</p>
			</div>
			<div class="bg-surface border-t-4 border-t-text-muted p-4 text-center" style="box-shadow: var(--shadow-elevated);">
				<p class="text-3xl font-display text-text-muted">{movements.length}</p>
				<p class="text-xs text-text-muted font-body uppercase tracking-wider">Movements</p>
			</div>
		</div>

		<!-- All sets grouped by movement -->
		<h2 class="text-xl font-display text-text-primary tracking-wider mb-4">All Sets</h2>
		<div class="space-y-3 mb-8">
			{#each movements as mv}
				<div class="bg-surface border-t-2 border-t-accent-track p-4" style="box-shadow: var(--shadow-elevated);">
					<h3 class="font-title font-bold text-text-primary mb-2">{mv.name}</h3>
					<div class="space-y-2">
						{#each mv.sets as set}
							<div class="flex items-center justify-between py-1 border-b border-accent-track/30 last:border-0">
								<div class="flex items-center gap-2">
									<span class="text-sm text-text-secondary font-body">
										Set {set.setNumber}
										{#if set.side}
											<span class="ml-1 px-1.5 py-0.5 bg-accent-primary/20 text-accent-primary text-xs uppercase">{set.side}</span>
										{/if}
									</span>
									{#if set.status === 'skipped'}
										<span class="text-xs text-warning">Skipped</span>
									{/if}
								</div>
								<div class="text-right">
									{#if mv.type === 'timed'}
										<span class="text-lg font-display text-accent-primary">{formatTime(set.value)}</span>
									{:else}
										<span class="text-lg font-display text-accent-primary">{set.value}</span>
										<span class="text-sm text-text-secondary">{set.targetType === 'time' ? 's' : 'reps'}</span>
									{/if}
									{#if set.weight}
										<span class="text-sm text-text-muted ml-2">{set.weight} {set.weightUnit || ''}</span>
									{/if}
									{#if set.rating}
										<span class="text-sm text-success ml-2">@{set.rating}</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Notes -->
		{#if data.practice.notes}
			<div class="bg-surface border-t-2 border-t-accent-track p-6 mb-8" style="box-shadow: var(--shadow-elevated);">
				<h3 class="text-lg font-display text-text-primary tracking-wider mb-2">Notes</h3>
				<p class="text-text-secondary font-body">{data.practice.notes}</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-3">
			<a
				href="/routine/{data.practice.routineId}"
				class="flex-1 bg-surface-elevated hover:bg-accent-track text-text-primary py-4 px-6 font-display text-lg tracking-widest uppercase text-center transition-colors border-2 border-accent-track"
			>
				View Routine
			</a>
			<a
				href="/"
				class="flex-1 bg-accent-primary hover:bg-accent-primary-light text-white py-4 px-6 font-display text-lg tracking-widest uppercase text-center transition-colors"
			>
				Back to Home
			</a>
		</div>
	</main>
</div>

<style>
	:global(body) {
		background: var(--color-base);
	}
</style>
