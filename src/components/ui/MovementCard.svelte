<script lang="ts">
	import { PencilSimple, Trash, PersonSimple, ArrowRight } from 'phosphor-svelte';

	interface Movement {
		id: string;
		name: string;
		description: string | null;
		type: string;
		isBilateral: boolean | null;
		isCustom: boolean | null;
		illustrationPath: string | null;
		equipment: string[] | null;
		metadata: {
			defaultTarget?: {
				value: number;
				unit?: string;
			} | null;
		} | null;
		userId: string | null;
	}

	let {
		movement,
		showActions = false,
		onDelete
	}: {
		movement: Movement;
		showActions?: boolean;
		onDelete?: (id: string) => void;
	} = $props();
</script>

<div
	class="group bg-surface border-t-4 border-t-accent-primary hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
	style="box-shadow: var(--shadow-elevated);"
>
	<div class="p-5">
		<!-- Name row - full width -->
		<div class="flex items-start gap-2 mb-2">
			<h3 class="font-display font-bold text-lg leading-tight">
				<a
					href="/movement/{movement.id}"
					class="text-text-primary hover:text-accent-primary transition-colors"
				>
					{movement.name}
				</a>
			</h3>
			{#if movement.isBilateral}
				<span class="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-accent-primary/10 text-accent-primary border border-accent-primary/30 whitespace-nowrap shrink-0 mt-1">
					L/R
				</span>
			{/if}
		</div>

		<!-- Metadata row -->
		<div class="flex items-center gap-3 mb-3">
			<!-- Small icon -->
			{#if movement.illustrationPath}
				<div class="w-8 h-8 flex items-center justify-center bg-inet shrink-0">
					<img
						src={movement.illustrationPath}
						alt=""
						class="w-6 h-6 object-contain opacity-80"
					/>
				</div>
			{:else}
				<div class="w-8 h-8 flex items-center justify-center bg-inset text-text-muted shrink-0">
					<PersonSimple weight="duotone" size={20} />
				</div>
			{/if}

			<span class="px-2 py-0.5 bg-inset text-xs text-text-muted font-mono uppercase tracking-wider">
				{movement.type}
			</span>

			{#if movement.isCustom}
				<span class="inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-accent-cream/10 text-text-muted border border-accent-track">
					Custom
				</span>
			{/if}

			{#if showActions}
				<div class="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
					<a
						href="/movement/{movement.id}/edit"
						class="p-1.5 bg-surface hover:bg-accent-primary text-text-muted hover:text-white transition-colors"
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
								onDelete(movement.id);
							}}
						>
							<Trash weight="duotone" size={16} />
						</button>
					{/if}
				</div>
			{/if}
		</div>

		{#if movement.description}
			<p class="text-text-secondary text-sm font-body mb-3 line-clamp-2">{movement.description}</p>
		{/if}

		<div class="flex items-center justify-between">
			<div class="flex flex-wrap gap-2 text-xs font-mono">
				{#if movement.metadata?.defaultTarget}
					<span class="px-2 py-1 bg-inset text-text-muted">
						Default: {movement.metadata.defaultTarget.value}
						{movement.metadata.defaultTarget.unit || ''}
					</span>
				{/if}
				{#if movement.equipment && movement.equipment.length > 0}
					{#each movement.equipment as item}
						<span class="px-2 py-1 bg-accent-primary/10 text-accent-primary border border-accent-primary/30">{item}</span>
					{/each}
				{/if}
			</div>
			
		<a
			href="/movement/{movement.id}"
			class="text-text-muted hover:text-accent-primary transition-colors shrink-0 ml-2"
		>
				<ArrowRight weight="duotone" size={14} />
			</a>
		</div>
	</div>
</div>
