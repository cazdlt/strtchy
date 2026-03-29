<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '../../components/ui/PageHeader.svelte';
	import MovementCard from '../../components/ui/MovementCard.svelte';
	import { PersonSimple, Plus, ArrowRight } from 'phosphor-svelte';

	let { data, form }: { data: PageData; form?: { error?: string } } = $props();

	let deleteForm: HTMLFormElement | null = $state(null);
	let deleteId: string | null = $state(null);

	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'MORNING';
		if (hour < 17) return 'AFTERNOON';
		return 'EVENING';
	}

	function handleDelete(id: string) {
		if (confirm('Are you sure you want to delete this movement?')) {
			deleteId = id;
			deleteForm?.requestSubmit();
		}
	}
</script>

<svelte:head>
	<title>Movements — Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base">
	<PageHeader
		user={data.user}
		title="Movements"
		subtitle="All available movements in your library"
		backUrl="/"
		backText="Home"
	/>

	<main class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Hero Section -->
		<section class="pt-8 pb-6 border-b-2 border-accent-track">
			<div class="flex flex-col gap-6">
				<!-- Greeting Block -->
				<div class="space-y-2">
					<div class="flex items-baseline gap-4">
						<span class="text-text-muted text-sm uppercase tracking-widest font-body">{getGreeting()}</span>
						<div class="flex-1 h-px bg-accent-track"></div>
					</div>
					<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
						MOVEMENT LIBRARY
					</h1>
				</div>

				<!-- Stats Bar -->
				<div class="flex items-center gap-8 py-4">
					<div class="flex items-baseline gap-2">
						<span class="font-display text-4xl text-accent-primary">{data.movements.length}</span>
						<span class="text-text-muted text-sm uppercase tracking-wider">total</span>
					</div>
					<div class="w-px h-8 bg-accent-track"></div>
					<div class="flex items-baseline gap-2">
						<span class="font-display text-4xl text-accent-secondary">
							{data.movements.filter(m => m.isBilateral).length}
						</span>
						<span class="text-text-muted text-sm uppercase tracking-wider">bilateral</span>
					</div>
					<div class="w-px h-8 bg-accent-track"></div>
					<div class="flex items-baseline gap-2">
						<span class="font-display text-4xl text-accent-warm">
							{data.movements.filter(m => m.isCustom).length}
						</span>
						<span class="text-text-muted text-sm uppercase tracking-wider">custom</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Create CTA Section -->
		{#if data.user}
			<section class="py-10 border-b border-accent-track">
				<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">
						ADD MOVEMENT
					</h2>
				</div>
				
				<a
					href="/movement/create"
					class="group inline-flex items-center gap-3 px-5 py-3 bg-surface hover:bg-surface-elevated transition-colors"
					style="box-shadow: var(--shadow-elevated);"
				>
					<div class="w-10 h-10 bg-accent-primary/10 flex items-center justify-center">
						<PersonSimple weight="duotone" size={20} class="text-accent-primary" />
					</div>
					<div class="text-left">
						<span class="block font-title text-text-primary text-sm uppercase tracking-wider">New movement</span>
						<span class="block text-text-muted text-xs">Add an exercise to your library</span>
					</div>
					<Plus weight="bold" size={14} class="text-text-muted group-hover:text-accent-primary transition-colors ml-2" />
				</a>
			</section>
		{/if}

		<!-- Movements Grid -->
		<section class="py-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<h2 class="font-display text-3xl text-text-primary tracking-wider">
					ALL MOVEMENTS
				</h2>
			</div>

			{#if form?.error}
				<div class="mb-6 p-4 bg-error/10 border-2 border-error text-error">
					{form.error}
				</div>
			{/if}

			<form bind:this={deleteForm} method="POST" action="?/delete" class="hidden">
				<input type="hidden" name="id" value={deleteId || ''} />
			</form>

			{#if data.movements.length === 0}
				<div class="bg-surface p-8 text-center" style="box-shadow: var(--shadow-elevated);">
					<p class="text-text-secondary">No movements yet</p>
				</div>
			{:else}
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
		</section>
	</main>

	<!-- Footer -->
	<footer class="border-t-2 border-accent-track mt-auto">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
			<p class="text-text-muted text-sm text-center font-body">
				STRTCHY — MOVE BETTER
			</p>
		</div>
	</footer>
</div>
