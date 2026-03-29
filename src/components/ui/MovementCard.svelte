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
	class="group bg-surface border-t border-accent-track hover:border-t-accent-blue hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
>
	<div class="p-5">
		<div class="flex items-start justify-between gap-3 mb-4">
			{#if movement.illustrationPath}
				<div class="flex-shrink-0">
					<img
						src={movement.illustrationPath}
						alt={movement.name}
						class="w-16 h-16 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
					/>
				</div>
			{:else}
				<div
					class="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-inset text-text-muted"
				>
					<PersonSimple weight="duotone" size={32} />
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<h3 class="font-display font-bold">
						<a
							href="/movement/{movement.id}"
							class="text-text-primary hover:text-accent-blue transition-colors"
						>
							{movement.name}
						</a>
					</h3>
					{#if movement.isBilateral}
						<span class="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
							L/R
						</span>
					{/if}
				</div>
				<span class="px-2 py-0.5 bg-inset text-xs text-text-muted font-mono uppercase tracking-wider">
					{movement.type}
				</span>
			</div>

			<div class="flex items-center gap-1 flex-shrink-0">
				{#if movement.isCustom}
					<span
						class="inline-flex items-center px-2 py-1 text-xs font-mono uppercase tracking-wider bg-accent-cream/10 text-text-muted border border-accent-track"
					>
						Custom
					</span>
				{/if}
				{#if showActions}
					<div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<a
							href="/movement/{movement.id}/edit"
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
									onDelete(movement.id);
								}}
							>
								<Trash weight="duotone" size={16} />
							</button>
						{/if}
					</div>
				{/if}
			</div>
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
						<span class="px-2 py-1 bg-accent-blue/10 text-accent-blue border border-accent-blue/30">{item}</span>
					{/each}
				{/if}
			</div>
			
			<a
				href="/movement/{movement.id}"
				class="text-text-muted hover:text-accent-blue transition-colors"
			>
				<ArrowRight weight="duotone" size={20} />
			</a>
		</div>
	</div>
</div>
