<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import MovementCard from '../../components/ui/MovementCard.svelte';

	let { data, form }: { data: PageData; form?: { error?: string } } = $props();

	let deleteForm: HTMLFormElement | null = $state(null);
	let deleteId: string | null = $state(null);

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this movement?')) {
			deleteId = id;
			deleteForm?.requestSubmit();
		}
	}
</script>

<svelte:head>
	<title>Movements - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<PageHeader
		user={data.user}
		title="Movements"
		subtitle="All available movements in your library"
		backUrl="/"
		backText="Home"
	/>

	<main class="max-w-4xl mx-auto p-6">
		{#if data.movements.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-400 text-lg mb-4">No movements yet</p>
				{#if data.user}
					<a
						href="/movement/create"
						class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
					>
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
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Create Your First Movement
					</a>
				{/if}
			</div>
		{:else}
			{#if data.user}
				<div class="mb-8">
					<a
						href="/movement/create"
						class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-lg transition-all font-medium shadow-lg shadow-emerald-500/20"
					>
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
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
					Create Movement
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
				{#each data.movements as movement}
					<MovementCard
						movement={{
							id: movement.id,
							name: movement.name,
							description: movement.description,
							type: movement.type,
							isBilateral: movement.isBilateral ?? null,
							isCustom: movement.isCustom ?? null,
							illustrationPath: movement.illustrationPath ?? null,
							equipment: movement.equipment ?? null,
							metadata: movement.metadata ?? null,
							userId: movement.userId ?? null
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
