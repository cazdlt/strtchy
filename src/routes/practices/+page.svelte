<script lang="ts">
	import { Clock, CaretLeft, CaretRight, CheckCircle, Circle } from 'phosphor-svelte';
	import { formatDuration } from '$lib/utils/formatting';
	import PageHeader from '../../components/ui/PageHeader.svelte';

	let { data } = $props<{ data: import('./$types').PageData }>();

	let practices = $derived(data.practices);
	let pagination = $derived(data.pagination);
</script>

<svelte:head>
	<title>Practice History - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary">
	<PageHeader user={data.user} backUrl="/" backText="Home" title="PRACTICE HISTORY" subtitle="{pagination.total} sessions recorded" />

	<main class="px-4 py-8 max-w-4xl mx-auto">

	{#if practices.length === 0}
		<div class="bg-surface p-8 text-center" style="box-shadow: var(--shadow-elevated);">
			<p class="text-text-secondary">No sessions yet. Pick a routine to start.</p>
		</div>
	{:else}
		<div class="space-y-0">
			{#each practices as practice, index}
				<a
					href="/practice/{practice.id}{practice.isCompleted ? '/summary' : ''}"
					class="group flex items-center gap-4 p-4 bg-surface hover:bg-surface-elevated transition-colors duration-150"
					class:border-b={index < practices.length - 1}
					class:border-accent-track={index < practices.length - 1}
					style={index === 0 ? 'box-shadow: var(--shadow-elevated);' : ''}
				>
					<div class="w-10 h-10 bg-surface-elevated flex items-center justify-center shrink-0">
						{#if practice.isCompleted}
							<CheckCircle weight="duotone" size={20} class="text-success" />
						{:else}
							<Circle weight="duotone" size={20} class="text-accent-secondary animate-pulse" />
						{/if}
					</div>

					<div class="flex-1 min-w-0">
						<p class="font-title text-text-primary group-hover:text-accent-primary transition-colors truncate">
							{practice.routineName}
						</p>
						<p class="text-text-muted text-sm">{practice.startedAtFormatted}</p>
					</div>

					{#if practice.durationFormatted}
						<div class="flex items-center gap-2 shrink-0">
							<Clock weight="duotone" size={16} class="text-accent-primary" />
							<span class="font-mono text-sm text-accent-primary">{practice.durationFormatted}</span>
						</div>
					{:else}
						<span class="shrink-0 text-xs text-accent-secondary flex items-center gap-1">
							<span class="w-1.5 h-1.5 bg-accent-secondary animate-pulse"></span>
							In progress
						</span>
					{/if}
				</a>
			{/each}
		</div>

		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-accent-track">
				{#if pagination.hasPrev}
					<a
						href="?page={pagination.page - 1}"
						class="flex items-center gap-1 px-4 py-2 bg-surface hover:bg-surface-elevated transition-colors font-body text-sm text-text-secondary hover:text-text-primary"
						style="box-shadow: var(--shadow-elevated);"
					>
						<CaretLeft weight="bold" size={14} />
						Previous
					</a>
				{:else}
					<span class="flex items-center gap-1 px-4 py-2 bg-surface/50 text-text-muted font-body text-sm cursor-not-allowed">
						<CaretLeft weight="bold" size={14} />
						Previous
					</span>
				{/if}

				<span class="font-mono text-sm text-text-muted px-3">
					{pagination.page} / {pagination.totalPages}
				</span>

				{#if pagination.hasNext}
					<a
						href="?page={pagination.page + 1}"
						class="flex items-center gap-1 px-4 py-2 bg-surface hover:bg-surface-elevated transition-colors font-body text-sm text-text-secondary hover:text-text-primary"
						style="box-shadow: var(--shadow-elevated);"
					>
						Next
						<CaretRight weight="bold" size={14} />
					</a>
				{:else}
					<span class="flex items-center gap-1 px-4 py-2 bg-surface/50 text-text-muted font-body text-sm cursor-not-allowed">
						Next
						<CaretRight weight="bold" size={14} />
					</span>
				{/if}
			</div>
		{/if}
	{/if}
	</main>
</div>

<style>
	:global(body) {
		background: var(--color-base);
	}
</style>
