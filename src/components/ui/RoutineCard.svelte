<script lang="ts">
	import { ArrowRight, PencilSimple, Trash, Clock, ListChecks } from 'phosphor-svelte';

	interface Routine {
		id: string;
		name: string;
		description: string | null;
		estimatedDuration: number | null;
		movementsCount: number;
		restBetweenMovements: number | null;
		restBetweenSets: number | null;
		autoAdvance: boolean | null;
		isCustom: boolean | null;
		userId: string | null;
	}

	let {
		routine,
		showActions = false,
		onDelete
	}: {
		routine: Routine;
		showActions?: boolean;
		onDelete?: (id: string) => void;
	} = $props();
</script>

<div
	class="group bg-surface border-t border-accent-track hover:border-t-accent-blue hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
>
	<div class="p-5">
		<div class="flex items-start justify-between gap-3 mb-3">
			<h3 class="font-display font-bold text-lg flex-1 min-w-0">
				<a
					href="/routine/{routine.id}"
					class="text-text-primary hover:text-accent-blue transition-colors block"
				>
					{routine.name}
				</a>
			</h3>
			<div class="flex items-center gap-1 flex-shrink-0">
				{#if routine.isCustom}
					<span
						class="inline-flex items-center px-2 py-1 text-xs font-mono uppercase tracking-wider bg-accent-cream/10 text-text-muted border border-accent-track"
					>
						Custom
					</span>
				{/if}
				{#if showActions}
					<div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<a
							href="/routine/{routine.id}/edit"
							class="p-1.5 bg-surface hover:bg-accent-blue text-text-muted hover:text-white transition-colors"
							title="Edit"
							onclick={(e) => e.stopPropagation()}
						>
							<PencilSimple weight="duotone" size={16} />
						</a>
						{#if onDelete}
							<button
								type="button"
								class="p-1.5 bg-surface hover:bg-error text-text-muted hover:text-white transition-colors"
								title="Delete"
								onclick={(e) => {
									e.stopPropagation();
									onDelete(routine.id);
								}}
							>
								<Trash weight="duotone" size={16} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if routine.description}
			<p class="text-text-secondary text-sm font-body mb-4 line-clamp-2">{routine.description}</p>
		{/if}

		<a
			href="/routine/{routine.id}"
			class="inline-flex items-center gap-2 text-sm text-accent-blue hover:text-accent-blue-light transition-colors mb-4"
		>
			<span class="font-bold uppercase tracking-wider">View Routine</span>
			<ArrowRight weight="duotone" size={16} />
		</a>

		<div class="flex flex-wrap gap-2 text-xs font-mono pt-3 border-t border-accent-track">
			{#if routine.estimatedDuration}
				<span class="px-2 py-1 bg-inset text-text-muted flex items-center gap-1">
					<Clock weight="duotone" size={12} />
					~{routine.estimatedDuration >= 60
						? Math.round(routine.estimatedDuration / 60) + 'm'
						: routine.estimatedDuration + 's'}
				</span>
			{/if}
			<span class="px-2 py-1 bg-inset text-text-muted flex items-center gap-1">
				<ListChecks weight="duotone" size={12} />
				{routine.movementsCount} movements
			</span>
			{#if routine.restBetweenMovements}
				<span class="px-2 py-1 bg-inset text-text-muted">Rest: {routine.restBetweenMovements}s</span>
			{/if}
			{#if routine.autoAdvance}
				<span class="px-2 py-1 bg-accent-blue/10 text-accent-blue border border-accent-blue/30">Auto-play</span>
			{/if}
		</div>
	</div>
</div>
