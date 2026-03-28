<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '../../../components/ui/PageHeader.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	function handleBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/movements');
		}
	}
</script>

<svelte:head>
	<title>{data.movement.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white pb-24">
	<PageHeader
		user={data.user}
		title={data.movement.name}
		subtitle="Movement Details"
		showNav={false}
	>
		<div class="flex items-center gap-3">
			{#if data.user && data.user.id === data.movement.userId}
				<a
					href="/movement/{data.movement.id}/edit"
					class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
				>
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
					</svg>
					Edit
				</a>
			{/if}
			<button
				onclick={handleBack}
				class="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
				</svg>
				Back
			</button>
		</div>
	</PageHeader>

	<main class="max-w-2xl mx-auto p-6 space-y-6 pt-6">
		<!-- Badges -->
		<div class="flex items-center gap-2">
			{#if data.movement.isBilateral}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400">
					L/R
				</span>
			{/if}
			{#if data.movement.isCustom}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-900/30 text-purple-400">
					Custom
				</span>
			{/if}
			<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700/50 text-gray-300 capitalize">
				{data.movement.type}
			</span>
		</div>

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

				{#if data.movement.equipment && data.movement.equipment.length > 0}
					<div>
						<dt class="text-gray-400 mb-2">Equipment</dt>
						<dd class="flex flex-wrap gap-2">
							{#each data.movement.equipment as item}
								<span class="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm">{item}</span>
							{/each}
						</dd>
					</div>
				{/if}

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
