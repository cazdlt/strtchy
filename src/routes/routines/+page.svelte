<script lang="ts">
	import type { PageData } from './$types';
	import logo from '$lib/assets/logo.svg';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Routines - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<header class="p-6 border-b border-gray-800">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<a href="/" class="flex items-center gap-4 hover:opacity-80 transition-opacity">
				<img src={logo} alt="Strtchy Logo" class="h-10" />
				<div>
					<p class="text-gray-400 text-sm">Your recovery companion</p>
				</div>
			</a>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-6">
		<div class="mb-8">
			<h1 class="text-3xl font-bold mb-2">Routines</h1>
			<p class="text-gray-400">All available routines</p>
		</div>

		{#if data.routines.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg mb-4">No routines yet</p>
				{#if data.user}
					<a
						href="/routine/create"
						class="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
					>
						Create Your First Routine
					</a>
				{/if}
			</div>
		{:else}
			{#if data.user}
				<div class="mb-8">
					<a
						href="/routine/create"
						class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium"
					>
						+ Create Routine
					</a>
				</div>
			{/if}

			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.routines as routine}
					<div
						class="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all relative"
					>
						{#if data.user}
							<div class="absolute top-2 right-2 flex gap-1">
								<a
									href="/routine/{routine.id}/edit"
									class="p-2 bg-gray-700/50 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg transition-colors text-xs"
									title="Edit"
								>
									✏️
								</a>
								<form
									method="POST"
									action="?/delete"
									onsubmit={(e) => {
										if (!confirm('Are you sure you want to delete this routine?')) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="id" value={routine.id} />
									<button
										type="submit"
										class="p-2 bg-gray-700/50 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-colors text-xs"
										title="Delete"
									>
										🗑️
									</button>
								</form>
							</div>
						{/if}

						<div class="flex items-start justify-between mb-3 pr-16">
							<h3 class="text-lg font-semibold">{routine.name}</h3>
							{#if routine.isCustom}
								<span
									class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400"
								>
									Custom
								</span>
							{/if}
						</div>

						{#if routine.description}
							<p class="text-gray-400 text-sm mb-4">{routine.description}</p>
						{/if}

						<a
							href="/routine/{routine.id}"
							class="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
						>
							View Routine →
						</a>

						<div class="flex flex-wrap gap-2 text-xs text-gray-500 mt-3">
							<span class="px-2 py-1 bg-gray-700/50 rounded">{routine.movementsCount} movements</span>
							{#if routine.restBetweenMovements}
								<span class="px-2 py-1 bg-gray-700/50 rounded"
									>Rest: {routine.restBetweenMovements}s</span
								>
							{/if}
							{#if routine.autoAdvance}
								<span class="px-2 py-1 bg-blue-900/30 text-blue-400 rounded">Auto-play</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
