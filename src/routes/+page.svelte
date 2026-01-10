<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import logo from '$lib/assets/logo.svg';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Strtchy - Routines</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
<header class="p-6 border-b border-gray-800">
	<div class="max-w-4xl mx-auto flex items-center justify-between">
		<div class="flex items-center gap-4">
			<img src={logo} alt="Strtchy Logo" class="h-10" />
			<div>
				<p class="text-gray-400 text-sm">Your recovery companion</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<a
				href="/routines"
				class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
			>
				Routines
			</a>
			{#if data.user}
				<form method="POST" action="?/logout">
					<button
						type="submit"
						class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
					>
						Log out
					</button>
				</form>
			{:else}
				<a
					href="/login"
					class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
				>
					Sign in
				</a>
			{/if}
		</div>
	</div>
</header>

  	<main class="max-w-4xl mx-auto p-6">
		<div class="mb-8">
			<h2 class="text-xl font-semibold mb-4">Browse</h2>
			<a
				href="/movements"
				class="flex items-center gap-4 p-6 bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-700/50 rounded-xl hover:border-orange-600/50 hover:from-orange-600/30 hover:to-red-600/30 transition-all"
			>
				<div class="text-4xl">📚</div>
				<div>
					<h3 class="text-lg font-semibold mb-1">View All Movements</h3>
					<p class="text-gray-400 text-sm">Browse your movement library</p>
				</div>
			</a>
		</div>

		{#if data.user}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4">Create</h2>
				<div class="grid gap-4 md:grid-cols-2">
					<a
						href="/movement/create"
						class="flex items-center gap-4 p-6 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-700/50 rounded-xl hover:border-emerald-600/50 hover:from-emerald-600/30 hover:to-emerald-800/30 transition-all"
					>
						<div class="text-4xl">🏃</div>
						<div>
							<h3 class="text-lg font-semibold mb-1">Create Movement</h3>
							<p class="text-gray-400 text-sm">Add a custom movement to your library</p>
						</div>
					</a>
					<a
						href="/routine/create"
						class="flex items-center gap-4 p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-700/50 rounded-xl hover:border-blue-600/50 hover:from-blue-600/30 hover:to-purple-600/30 transition-all"
					>
						<div class="text-4xl">📋</div>
						<div>
							<h3 class="text-lg font-semibold mb-1">Create Routine</h3>
							<p class="text-gray-400 text-sm">Build a custom routine from movements</p>
						</div>
					</a>
				</div>
			</div>
		{/if}

  		<div class="mb-8">
  			<div class="flex items-center justify-between mb-4">
  				<h2 class="text-xl font-semibold">Ready Routines</h2>
  				<a href="/routines" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
  					View All Routines →
  				</a>
  			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.routines.slice(0, 6) as routine}
					<a
						href="/routine/{routine.id}"
						class="block p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all"
					>
						<h3 class="text-lg font-semibold mb-2">{routine.name}</h3>
						<p class="text-gray-400 text-sm mb-4">{routine.description}</p>
						<div class="flex gap-4 text-xs text-gray-500">
							{#if routine.restBetweenMovements}
								<span>Rest: {routine.restBetweenMovements}s</span>
							{/if}
							{#if routine.autoAdvance}
								<span>Auto-play</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</div>

		<div>
			<h2 class="text-xl font-semibold mb-4">Recent Practices</h2>
			{#if data.recentPractices.length === 0}
				<p class="text-gray-500 text-sm">No practices yet. Start a routine!</p>
			{:else}
				<div class="space-y-3">
					{#each data.recentPractices as practice}
						<a
							href="/practice/{practice.id}{practice.duration ? '/summary' : ''}"
							class="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-800 rounded-lg hover:border-gray-700 transition-all"
						>
							<div>
								<p class="font-medium">{practice.routineName}</p>
								<p class="text-gray-500 text-sm">{practice.startedAt}</p>
							</div>
							{#if practice.duration}
								<span class="text-gray-400 text-sm">{formatDuration(practice.duration)}</span>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
