<script lang="ts">
	import { formatDuration, getRelativeTime, formatTime } from '$lib/utils/formatting';
	import type { PageData } from './$types';

	export let data: PageData;

	// Helper to determine the status of a set
	function getSetStatus(rm: typeof data.allRoutineMovements[0], setNumber: number, side: 'left' | 'right' | null) {
		// Find matching practice data
		const pd = data.practice.practiceData.find(
			p => p.routineMovementId === rm.id && 
				 p.setNumber === setNumber && 
				 p.side === side
		);
		
		if (!pd) {
			return { type: 'not-started' as const };
		}
		
		if (pd.status === 'skipped') {
			return { 
				type: 'skipped' as const, 
				data: pd,
				isZeroReps: pd.value === 0 
			};
		}
		
		if (pd.value === 0) {
			return { 
				type: 'zero-reps' as const, 
				data: pd 
			};
		}
		
		return { 
			type: 'completed' as const, 
			data: pd 
		};
	}

	// Generate all expected sets for a movement
	function generateAllSets(rm: typeof data.allRoutineMovements[0]) {
		const actualSets = data.practice.setOverrides?.[rm.id] ?? rm.sets;
		const sets: Array<{ setNumber: number; side: 'left' | 'right' | null; rm: typeof data.allRoutineMovements[0] }> = [];
		
		for (let i = 1; i <= actualSets; i++) {
			if (rm.isBilateral) {
				sets.push({ setNumber: i, side: 'left', rm });
				sets.push({ setNumber: i, side: 'right', rm });
			} else {
				sets.push({ setNumber: i, side: null, rm });
			}
		}
		
		return sets;
	}

	// Calculate totals
	const totalSets = data.allRoutineMovements.reduce((sum, rm) => {
		const sets = data.practice.setOverrides?.[rm.id] ?? rm.sets;
		return sum + (rm.isBilateral ? sets * 2 : sets);
	}, 0);
	
	const completedSets = data.practice.practiceData.filter(pd => pd.status !== 'skipped').length;
	const skippedSets = data.practice.practiceData.filter(pd => pd.status === 'skipped').length;
	const notStartedSets = totalSets - data.practice.practiceData.length;
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
				<p class="text-3xl font-display text-text-muted">{notStartedSets}</p>
				<p class="text-xs text-text-muted font-body uppercase tracking-wider">Not Started</p>
			</div>
		</div>

		<!-- All sets (completed, skipped, not-started) -->
		<h2 class="text-xl font-display text-text-primary tracking-wider mb-4">All Sets ({totalSets})</h2>
		<div class="space-y-3 mb-8">
			{#each data.allRoutineMovements as rm}
				{@const movementSets = generateAllSets(rm)}
				{#each movementSets as setInfo}
					{@const status = getSetStatus(rm, setInfo.setNumber, setInfo.side)}
					{@const isGreyed = status.type === 'skipped' || status.type === 'zero-reps' || status.type === 'not-started'}
					
					<div class="p-4 {isGreyed ? 'bg-surface-elevated/50' : 'bg-surface'} border-t-2 {isGreyed ? 'border-t-text-muted/30' : 'border-t-accent-track'}" style="box-shadow: var(--shadow-elevated);">
						<div class="flex justify-between items-start mb-2">
							<div>
								<h3 class="font-title font-bold {isGreyed ? 'text-text-muted' : 'text-text-primary'}">
									{rm.movement.name}
								</h3>
								<p class="text-text-secondary text-sm font-body">
									Set {setInfo.setNumber}
									{#if setInfo.side}
										<span class="ml-2 px-2 py-0.5 {isGreyed ? 'bg-text-muted/20 text-text-muted' : 'bg-accent-primary/20 text-accent-primary'} text-xs font-body uppercase tracking-wider">
											{setInfo.side === 'left' ? 'Left' : 'Right'}
										</span>
									{/if}
									{#if status.type === 'skipped'}
										<span class="ml-2 px-2 py-0.5 bg-warning/20 text-warning text-xs font-body uppercase tracking-wider">
											Skipped
										</span>
									{:else if status.type === 'zero-reps'}
										<span class="ml-2 px-2 py-0.5 bg-error/20 text-error text-xs font-body uppercase tracking-wider">
											0 Reps
										</span>
									{:else if status.type === 'not-started'}
										<span class="ml-2 px-2 py-0.5 bg-text-muted/20 text-text-muted text-xs font-body uppercase tracking-wider">
											Not Started
										</span>
									{/if}
								</p>
							</div>
							<div class="text-right">
								{#if status.type === 'completed' && status.data}
									{#if status.data.measurementType === 'time'}
										<p class="text-2xl font-display text-accent-primary">{formatDuration(status.data.value)}</p>
									{:else if status.data.measurementType === 'reps'}
										<p class="text-2xl font-display text-accent-primary">{status.data.value} reps</p>
									{:else}
										<p class="text-2xl font-display text-accent-primary">{status.data.value}</p>
									{/if}
								{:else if status.type === 'skipped' && status.data}
									{#if status.data.measurementType === 'time'}
										<p class="text-2xl font-display text-text-muted">{formatDuration(status.data.value)}</p>
									{:else if status.data.measurementType === 'reps'}
										<p class="text-2xl font-display text-warning">{status.data.value} reps</p>
									{:else}
										<p class="text-2xl font-display text-text-muted">{status.data.value}</p>
									{/if}
								{:else if status.type === 'zero-reps' && status.data}
									<p class="text-2xl font-display text-error">0 reps</p>
								{:else}
									<p class="text-2xl font-display text-text-muted">-</p>
								{/if}
							</div>
						</div>

						{#if (status.type === 'completed' || status.type === 'skipped' || status.type === 'zero-reps') && status.data}
							{#if status.data.weight}
								<p class="text-sm text-text-muted mt-2 font-body">
									Weight: <span class="{isGreyed ? 'text-text-muted' : 'text-text-primary'} font-bold">{status.data.weight} {status.data.weightUnit || ''}</span>
								</p>
							{/if}

							{#if status.data.customMeasurement}
								<p class="text-sm text-text-muted mt-2 font-body">
									Measurement: <span class="{isGreyed ? 'text-text-muted' : 'text-text-primary'} font-bold">{status.data.customMeasurement}</span>
								</p>
							{/if}

							{#if status.data.rating}
								<p class="text-sm {isGreyed ? 'text-text-muted' : 'text-success'} mt-2 font-body">
									Rating: <span class="{isGreyed ? 'text-text-muted' : 'text-text-primary'} font-bold">{status.data.rating}/10</span>
								</p>
							{/if}

							<p class="text-xs text-text-muted mt-2 font-body">
								Completed {getRelativeTime(status.data.completedAt)}
								{#if status.type === 'skipped'}
									<span class="text-warning ml-1">(Skipped)</span>
								{:else if status.type === 'zero-reps'}
									<span class="text-error ml-1">(0 reps completed)</span>
								{/if}
							</p>
						{/if}
					</div>
				{/each}
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
