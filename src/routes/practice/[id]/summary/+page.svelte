<script lang="ts">
	import { formatDuration, getRelativeTime } from '$lib/utils/formatting';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Practice Summary - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<header class="p-6 border-b border-gray-800">
		<div class="max-w-4xl mx-auto">
			<a href="/routine/{data.practice.routineId}" class="text-gray-400 hover:text-white text-sm mb-2 inline-block">&larr; Start Again</a>
			<h1 class="text-3xl font-bold">Practice Complete! 🎉</h1>
			<p class="text-gray-400 mt-2">{data.practice.routine.name}</p>
		</div>
	</header>

	<main class="max-w-4xl mx-auto p-6">
		<!-- Stats -->
		<div class="grid grid-cols-2 gap-4 mb-8">
			<div class="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
				<p class="text-gray-400 text-sm mb-1">Duration</p>
				<p class="text-2xl font-bold">
					{data.practice.duration ? formatDuration(data.practice.duration) : 'In progress'}
				</p>
			</div>
			<div class="bg-gray-800/50 border border-gray-700 p-6 rounded-xl">
				<p class="text-gray-400 text-sm mb-1">Completed At</p>
				<p class="text-2xl font-bold">
					{data.practice.completedAt ? getRelativeTime(data.practice.completedAt) : 'N/A'}
				</p>
			</div>
		</div>

		<!-- Completed sets -->
		<h2 class="text-xl font-semibold mb-4">Completed Sets ({data.practice.practiceData.length})</h2>
		<div class="space-y-3 mb-8">
			{#each data.practice.practiceData as pd}
				{@const rm = pd.routineMovement}
				{@const m = rm.movement}

					<div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
					<div class="flex justify-between items-start mb-2">
						<div>
							<h3 class="font-semibold">{m.name}</h3>
							<p class="text-gray-400 text-sm">
								Set {pd.setNumber}
								{#if pd.side}
									<span class="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
										{pd.side === 'left' ? 'Left' : 'Right'}
									</span>
								{/if}
							</p>
						</div>
						<div class="text-right">
							{#if pd.measurementType === 'time'}
								<p class="text-2xl font-bold text-blue-400">{formatDuration(pd.value)}</p>
							{:else if pd.measurementType === 'reps'}
								<p class="text-2xl font-bold text-blue-400">{pd.value} reps</p>
							{:else}
								<p class="text-2xl font-bold text-blue-400">{pd.value}</p>
							{/if}
						</div>
					</div>

					{#if pd.weight}
						<p class="text-sm text-gray-500 mt-2">
							Weight: <span class="text-white">{pd.weight} {pd.weightUnit || ''}</span>
						</p>
					{/if}

					{#if pd.customMeasurement}
						<p class="text-sm text-gray-500 mt-2">
							Measurement: <span class="text-white">{pd.customMeasurement}</span>
						</p>
					{/if}

					{#if pd.rating}
						<p class="text-sm text-emerald-400 mt-2">
							Rating: <span class="text-white">{pd.rating}/10</span>
						</p>
					{/if}

					<p class="text-xs text-gray-600 mt-2">
						Completed {getRelativeTime(pd.completedAt)}
					</p>
				</div>
			{/each}
		</div>

		<!-- Notes -->
		{#if data.practice.notes}
			<div class="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8">
				<h3 class="text-lg font-semibold mb-2">Notes</h3>
				<p class="text-gray-300">{data.practice.notes}</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-3">
			<a
				href="/routine/{data.practice.routineId}"
				class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all"
			>
				View Routine
			</a>
			<a
				href="/"
				class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all"
			>
				Back to Home
			</a>
		</div>
	</main>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>
