<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import RoutineCard from '../../components/ui/RoutineCard.svelte';

	let { data, form }: { data: PageData; form?: { error?: string } } = $props();

	let deleteForm: HTMLFormElement | null = $state(null);
	let deleteId: string | null = $state(null);

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this routine?')) {
			deleteId = id;
			deleteForm?.requestSubmit();
		}
	}
</script>

<svelte:head>
	<title>Routines - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<PageHeader
		user={data.user}
		title="Routines"
		subtitle="All available routines"
		backUrl="/"
		backText="Home"
	/>

	<main class="max-w-4xl mx-auto p-6">
		{#if data.routines.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg mb-4">No routines yet</p>
				{#if data.user}
					<a
						href="/routine/create"
						class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						Create Your First Routine
					</a>
				{/if}
			</div>
		{:else}
			{#if data.user}
				<div class="mb-8">
					<a
						href="/routine/create"
						class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-500/20"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-5 h-5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
						</svg>
						Create Routine
					</a>
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
					{form.error}
				</div>
			{/if}

			<form bind:this={deleteForm} method="POST" action="?/delete" class="hidden">
				<input type="hidden" name="id" value={deleteId || ''} />
			</form>

			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.routines as routine}
					<RoutineCard
						routine={{
							id: routine.id,
							name: routine.name,
							description: routine.description,
							estimatedDuration: routine.estimatedDuration ?? null,
							movementsCount: routine.movementsCount,
							restBetweenMovements: routine.restBetweenMovements ?? null,
							restBetweenSets: routine.restBetweenSets ?? null,
							autoAdvance: routine.autoAdvance ?? null,
							isCustom: routine.isCustom ?? null,
							userId: routine.userId ?? null
						}}
						showActions={!!data.user}
						onDelete={handleDelete}
					/>
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
