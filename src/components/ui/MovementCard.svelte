<script lang="ts">
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
	class="group bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all overflow-hidden"
>
	<div class="p-4">
		<div class="flex items-start justify-between gap-3 mb-3">
			{#if movement.illustrationPath}
				<div class="flex-shrink-0">
					<img
						src={movement.illustrationPath}
						alt={movement.name}
						class="w-16 h-16 object-contain"
					/>
				</div>
			{:else}
				<div
					class="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gray-700/30 rounded-lg text-gray-600 text-2xl"
				>
					🏃
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<h3 class="font-semibold">
						<a
							href="/movement/{movement.id}"
							class="hover:text-emerald-400 transition-colors"
						>
							{movement.name}
						</a>
					</h3>
					{#if movement.isBilateral}
						<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
							L/R
						</span>
					{/if}
				</div>
				<span class="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400 capitalize">
					{movement.type}
				</span>
			</div>

			<div class="flex items-center gap-1 flex-shrink-0">
				{#if movement.isCustom}
					<span
						class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400"
					>
						Custom
					</span>
				{/if}
				{#if showActions}
					<div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<a
							href="/movement/{movement.id}/edit"
							class="p-1.5 bg-gray-700/50 hover:bg-blue-600 text-gray-400 hover:text-white rounded transition-colors"
							title="Edit"
							onclick={(e) => e.stopPropagation()}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
								class="w-4 h-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
								/>
							</svg>
						</a>
						{#if onDelete}
							<button
								type="button"
								class="p-1.5 bg-gray-700/50 hover:bg-red-600 text-gray-400 hover:text-white rounded transition-colors"
								title="Delete"
								onclick={(e) => {
									e.stopPropagation();
									onDelete(movement.id);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2"
									stroke="currentColor"
									class="w-4 h-4"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.016-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
									/>
								</svg>
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if movement.description}
			<p class="text-gray-400 text-sm mb-3 line-clamp-2">{movement.description}</p>
		{/if}

		<div class="flex flex-wrap gap-2 text-xs text-gray-500">
			{#if movement.metadata?.defaultTarget}
				<span class="px-2 py-1 bg-gray-700/50 rounded">
					Default: {movement.metadata.defaultTarget.value}
					{movement.metadata.defaultTarget.unit || ''}
				</span>
			{/if}
			{#if movement.equipment && movement.equipment.length > 0}
				{#each movement.equipment as item}
					<span class="px-2 py-1 bg-blue-900/30 text-blue-400 rounded">{item}</span>
				{/each}
			{/if}
		</div>
	</div>
</div>
