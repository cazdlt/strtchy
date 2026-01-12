<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.movement.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white pb-24">
	<header class="p-6 border-b border-gray-800">
		<div class="max-w-2xl mx-auto">
			<a href="/movements" class="text-gray-400 hover:text-white text-sm mb-2 inline-block">&larr; Back to Movements</a>
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-3xl font-bold">{data.movement.name}</h1>
					{#if data.movement.isBilateral}
						<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400">
							L/R
						</span>
					{/if}
					{#if data.movement.isCustom}
						<span
							class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900/30 text-purple-400"
						>
							Custom
						</span>
					{/if}
				</div>
				<a
					href="/movement/{data.movement.id}/edit"
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
				>
					Edit
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-2xl mx-auto p-6 space-y-6">
		{#if data.movement.illustrationPath}
			<div class="flex justify-center">
				{#if data.movement.illustrationPath.startsWith('<svg')}
					<div class="w-48 h-48 text-gray-600">
						{@html data.movement.illustrationPath}
					</div>
				{:else}
					<img
						src={data.movement.illustrationPath}
						alt={data.movement.name}
						class="w-48 h-48 object-contain"
					/>
				{/if}
			</div>
		{/if}

		{#if data.movement.description}
			<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
				<h2 class="text-lg font-semibold mb-2">Description</h2>
				<p class="text-gray-300">{data.movement.description}</p>
			</section>
		{/if}

		<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6">
			<h2 class="text-lg font-semibold mb-4">Details</h2>
			<dl class="space-y-4">
				<div class="flex justify-between">
					<dt class="text-gray-400">Type</dt>
					<dd class="font-medium capitalize">{data.movement.type}</dd>
				</div>

				{#if data.movement.metadata?.defaultTarget}
					<div class="flex justify-between">
						<dt class="text-gray-400">Default Target</dt>
						<dd class="font-medium">
							{data.movement.metadata.defaultTarget.value}
							{data.movement.metadata.defaultTarget.unit || ''}
						</dd>
					</div>
				{/if}

				{#if data.movement.type === 'weighted' && data.movement.weightUnit}
					<div class="flex justify-between">
						<dt class="text-gray-400">Weight Unit</dt>
						<dd class="font-medium capitalize">{data.movement.weightUnit}</dd>
					</div>
				{/if}

				{#if data.movement.isBilateral}
					<div class="flex justify-between">
						<dt class="text-gray-400">Switch Sides Duration</dt>
						<dd class="font-medium">{data.movement.switchSidesDuration}s</dd>
					</div>
				{/if}
			</dl>
		</section>
	</main>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}

	:global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
