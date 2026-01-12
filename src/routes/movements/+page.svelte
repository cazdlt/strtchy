<script lang="ts">
	import type { PageData } from './$types';
	import logo from '$lib/assets/logo.svg';

	export let data: PageData;
</script>

<svelte:head>
	<title>Movements - Strtchy</title>
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
			<h1 class="text-3xl font-bold mb-2">Movements</h1>
			<p class="text-gray-400">All available movements in your library</p>
		</div>

		{#if data.movements.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg mb-4">No movements yet</p>
				<a
					href="/movement/create"
					class="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
				>
					Create Your First Movement
				</a>
			</div>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.movements as movement}
					<div
						class="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all relative"
					>
						{#if data.user}
							<div class="absolute top-2 right-2 flex gap-1">
								<a
									href="/movement/{movement.id}/edit"
									class="p-2 bg-gray-700/50 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg transition-colors text-xs"
									title="Edit"
								>
									✏️
								</a>
								<form
									method="POST"
									action="?/delete"
									onsubmit={(e) => {
										if (!confirm('Are you sure you want to delete this movement?')) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="id" value={movement.id} />
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

						{#if movement.illustrationPath}
							<div class="mb-3 flex justify-center">
								<img
									src={movement.illustrationPath}
									alt={movement.name}
									class="w-24 h-24 object-contain"
								/>
							</div>
						{:else}
							<div
								class="mb-3 w-24 h-24 mx-auto flex items-center justify-center bg-gray-700/30 rounded-lg text-gray-600 text-3xl"
							>
								🏃
							</div>
						{/if}

						<div class="flex items-start justify-between mb-3 pr-16">
							<div class="flex items-center gap-2">
								<a href="/movement/{movement.id}" class="font-semibold hover:text-emerald-400 transition">
									{movement.name}
								</a>
								{#if movement.isBilateral}
									<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400">
										L/R
									</span>
								{/if}
							</div>
							{#if movement.isCustom}
								<span
									class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400"
								>
									Custom
								</span>
							{/if}
						</div>

						{#if movement.description}
							<p class="text-gray-400 text-sm mb-4">{movement.description}</p>
						{/if}

						<div class="flex flex-wrap gap-2 text-xs text-gray-500">
							<span class="px-2 py-1 bg-gray-700/50 rounded">{movement.type}</span>
							{#if movement.metadata?.defaultTarget}
								<span class="px-2 py-1 bg-gray-700/50 rounded"
									>Default: {movement.metadata.defaultTarget.value}
									{movement.metadata.defaultTarget.unit || ''}</span
								>
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
