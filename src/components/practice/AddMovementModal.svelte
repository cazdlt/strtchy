<script lang="ts">
	interface Movement {
		id: string;
		name: string;
		description?: string;
		type: string;
	}

	let {
		isOpen,
		isLoading,
		isPaused,
		groupedMovements,
		onAdd,
		onClose
	} = $props<{
		isOpen: boolean;
		isLoading: boolean;
		isPaused: boolean;
		groupedMovements: Record<string, Movement[]>;
		onAdd: (movementId: string) => void;
		onClose: () => void;
	}>();
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-base/95 z-50 flex items-center justify-center p-4">
		<div class="bg-surface border-t-4 border-t-accent-primary max-w-2xl w-full max-h-[80vh] flex flex-col" style="box-shadow: var(--shadow-floating);">
			<div class="p-4 border-b border-accent-track flex items-center justify-between">
				<h2 class="text-lg font-display text-text-primary tracking-wider">Add Movement</h2>
				<button
					onclick={onClose}
					disabled={isPaused}
					aria-label="Close"
					class="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-colors"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-4 overflow-y-auto flex-1">
				{#if isLoading}
					<div class="flex items-center justify-center py-8">
						<svg class="animate-spin h-6 w-6 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
			{:else}
				{#each Object.entries(groupedMovements) as [category, movementsList] (category)}
					{@const movements = movementsList as Movement[]}
					{#if movements.length > 0}
						<div class="mb-4">
							<h3 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 font-title">{category}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{#each movements as movement (movement.id)}
									<button
										onclick={() => onAdd(movement.id)}
										disabled={isPaused}
										class="text-left p-3 bg-surface-elevated border border-accent-track hover:border-accent-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-accent-track disabled:hover:bg-surface-elevated transition-colors"
									>
										<div class="font-title font-bold text-sm text-text-primary">{movement.name}</div>
										{#if movement.description}
											<div class="text-xs text-text-secondary mt-1 line-clamp-2 font-body">{movement.description}</div>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			{/if}
			</div>
		</div>
	</div>
{/if}
