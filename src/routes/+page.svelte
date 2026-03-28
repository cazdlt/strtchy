<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import PageHeader from '../components/ui/PageHeader.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Strtchy - Your Recovery Companion</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<PageHeader user={data.user} showNav={false} />

	<main class="max-w-4xl mx-auto p-6">
		{#if data.user}
			<div class="mb-8">
				<h2 class="text-xl font-semibold mb-4">Create</h2>
				<div class="grid gap-4 md:grid-cols-2 min-w-0">
				<a
					href="/movement/create"
					class="flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-700/50 rounded-xl hover:border-emerald-600/50 hover:from-emerald-600/30 hover:to-emerald-800/30 transition-all min-w-0"
				>
					<div class="text-2xl flex-shrink-0">🏃</div>
						<div>
							<h3 class="text-lg font-semibold mb-1">Create Movement</h3>
							<p class="text-gray-400 text-sm">Add a custom movement to your library</p>
						</div>
					</a>
				<a
					href="/routine/create"
					class="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-700/50 rounded-xl hover:border-blue-600/50 hover:from-blue-600/30 hover:to-purple-600/30 transition-all min-w-0"
				>
					<div class="text-2xl flex-shrink-0">📋</div>
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
				<a
					href="/routines"
					class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
				>
					Browse all
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-4 h-4"
						width="16"
						height="16"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-w-0">
				{#each data.routines.slice(0, 6) as routine}
					<a
						href="/routine/{routine.id}"
						class="block p-5 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all"
					>
						<div class="flex items-start justify-between mb-2">
							<h3 class="font-semibold">{routine.name}</h3>
							{#if routine.isCustom}
								<span class="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded">Custom</span>
							{/if}
						</div>
						{#if routine.description}
							<p class="text-gray-400 text-sm mb-3 line-clamp-2">{routine.description}</p>
						{/if}
					</a>
				{/each}
			</div>
		</div>

		<div class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-semibold">Movement Library</h2>
				<a
					href="/movements"
					class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
				>
					Browse all
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-4 h-4"
						width="16"
						height="16"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-w-0">
				{#each data.movements.slice(0, 6) as movement}
					<a
						href="/movement/{movement.id}"
						class="flex items-center gap-3 p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-800 transition-all"
					>
						{#if movement.illustrationPath}
							<img src={movement.illustrationPath} alt={movement.name} class="w-12 h-12 object-contain" />
						{:else}
							<div class="w-12 h-12 flex items-center justify-center bg-gray-700/30 rounded-lg text-gray-600 text-xl">🏃</div>
						{/if}
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-medium truncate">{movement.name}</span>
								{#if movement.isBilateral}
									<span class="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded">L/R</span>
								{/if}
							</div>
							<span class="text-xs text-gray-500 capitalize">{movement.type}</span>
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
