<script lang="ts">
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
	class="group bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all overflow-hidden"
>
	<div class="p-4">
		<div class="flex items-start justify-between gap-3 mb-3">
			<h3 class="text-lg font-semibold flex-1 min-w-0">
				<a
					href="/routine/{routine.id}"
					class="hover:text-emerald-400 transition-colors block"
				>
					{routine.name}
				</a>
			</h3>
			<div class="flex items-center gap-1 flex-shrink-0">
				{#if routine.isCustom}
					<span
						class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400"
					>
						Custom
					</span>
				{/if}
				{#if showActions}
					<div class="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<a
							href="/routine/{routine.id}/edit"
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
									onDelete(routine.id);
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

		{#if routine.description}
			<p class="text-gray-400 text-sm mb-4 line-clamp-2">{routine.description}</p>
		{/if}

		<a
			href="/routine/{routine.id}"
			class="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mb-3"
		>
			View Routine
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2"
				stroke="currentColor"
				class="w-4 h-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
			</svg>
		</a>

		<div class="flex flex-wrap gap-2 text-xs text-gray-500 pt-3 border-t border-gray-700/50">
			{#if routine.estimatedDuration}
				<span class="px-2 py-1 bg-gray-700/50 rounded">
					⏱️ ~{routine.estimatedDuration >= 60
						? Math.round(routine.estimatedDuration / 60) + 'm'
						: routine.estimatedDuration + 's'}
				</span>
			{/if}
			<span class="px-2 py-1 bg-gray-700/50 rounded">{routine.movementsCount} movements</span>
			{#if routine.restBetweenMovements}
				<span class="px-2 py-1 bg-gray-700/50 rounded">Rest: {routine.restBetweenMovements}s</span>
			{/if}
			{#if routine.autoAdvance}
				<span class="px-2 py-1 bg-blue-900/30 text-blue-400 rounded">Auto-play</span>
			{/if}
		</div>
	</div>
</div>
