<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showConfirm = $state(false);
</script>

<svelte:head>
	<title>{data.routine.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white pb-24">
	<header class="p-6 border-b border-gray-800">
		<div class="max-w-4xl mx-auto">
			<div class="flex items-start justify-between">
				<div>
					<a href="/routines" class="text-gray-400 hover:text-white text-sm mb-2 inline-block">&larr; Back to Routines</a>
					<h1 class="text-3xl font-bold">{data.routine.name}</h1>
					<p class="text-gray-400 mt-2">{data.routine.description}</p>
				</div>
				{#if data.user}
					<a
						href="/routine/{data.routine.id}/edit"
						class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
					>
						Edit
					</a>
				{/if}
			</div>

			<div class="flex gap-4 mt-4 text-sm">
				{#if data.routine.restBetweenMovements}
					<span class="bg-gray-800 px-3 py-1 rounded-full">
						Rest: {data.routine.restBetweenMovements}s
					</span>
				{/if}
				{#if data.routine.autoAdvance}
					<span class="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full">Auto-play</span>
				{/if}
				{#if data.routine.audioEnabled}
					<span class="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full">Audio</span>
				{/if}
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-6">
		<h2 class="text-xl font-semibold mb-4">Movements ({data.routine.movements.length})</h2>
		<div class="space-y-3">
			{#each data.routine.movements as rm, index (rm.id)}
				<div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
					<div class="flex items-start justify-between mb-2">
						<div class="flex items-center gap-3">
							<span class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
								{index + 1}
							</span>
							<div>
								<h3 class="font-semibold">{rm.movement.name}</h3>
								<p class="text-gray-400 text-sm">{rm.movement.description}</p>
							</div>
						</div>
					</div>

					<div class="ml-11 mt-3 space-y-2">
						<div class="text-sm">
							{#if rm.target.type === 'time'}
								<span class="bg-gray-700 px-2 py-1 rounded">
									Hold for {formatDuration(rm.target.value)}
									{rm.target.unit}
								</span>
							{:else if rm.target.type === 'reps'}
								<span class="bg-gray-700 px-2 py-1 rounded">
									{rm.target.value} reps
								</span>
							{:else if rm.target.type === 'distance'}
								<span class="bg-gray-700 px-2 py-1 rounded">
									{rm.target.value} {rm.target.unit || 'meters'}
								</span>
							{/if}

							{#if rm.sets > 1}
								<span class="text-gray-500">&times; {rm.sets} sets</span>
							{/if}
						</div>

						{#if rm.notes}
							<p class="text-xs text-gray-500 italic">{rm.notes}</p>
						{/if}
					</div>

					<!-- Illustration -->
					{#if rm.movement.illustrationPath}
						<div class="ml-11 mt-3">
							{#if rm.movement.illustrationPath.startsWith('<svg')}
								<div class="w-32 h-32 text-gray-600">
									{@html rm.movement.illustrationPath}
								</div>
							{:else}
								<img 
									src={rm.movement.illustrationPath} 
									alt={rm.movement.name} 
									class="w-32 h-32 object-contain"
								/>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</main>

	<!-- Fixed bottom button -->
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 border-t border-gray-800 backdrop-blur">
		<form method="POST" action="?/startPractice" use:enhance>
			<div class="max-w-4xl mx-auto">
				{#if showConfirm}
					<div class="flex gap-3">
						<button
							type="button"
							onclick={() => (showConfirm = false)}
							class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-all"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 px-6 rounded-xl font-semibold transition-all"
						>
							Yes, Start!
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (showConfirm = true)}
						class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 px-6 rounded-xl font-semibold transition-all"
					>
						Start Practice
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}

	:global(svg) {
		width: 80px;
		height: 80px;
	}
</style>

