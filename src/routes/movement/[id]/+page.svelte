<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '../../../components/ui/PageHeader.svelte';
	import { goto } from '$app/navigation';
	import { PersonSimple, ArrowsLeftRight, Timer, Barbell, ArrowLeft, PencilSimple, Stack } from 'phosphor-svelte';

	let { data }: { data: PageData } = $props();

	function handleBack() {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/movements');
		}
	}

	function formatTarget(movement: any) {
		if (!movement.metadata?.defaultTarget) return null;
		const { value, unit } = movement.metadata.defaultTarget;
		return `${value} ${unit || ''}`;
	}
</script>

<svelte:head>
	<title>{data.movement.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary">
	<PageHeader user={data.user} showNav={false}>
		<div class="flex items-center gap-3">
			{#if data.user && data.user.id === data.movement.userId}
				<a
					href="/movement/{data.movement.id}/edit"
					class="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated text-text-primary transition-colors border border-accent-track hover:border-accent-primary"
				>
					<PencilSimple weight="bold" size={14} class="text-accent-primary" />
					<span class="font-body text-sm uppercase tracking-wider">Edit</span>
				</a>
			{/if}
			<button
				onclick={handleBack}
				class="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors border border-accent-track"
			>
				<ArrowLeft weight="bold" size={14} />
				<span class="font-body text-sm">Back</span>
			</button>
		</div>
	</PageHeader>

	<main class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
		<!-- Header Section -->
		<section class="mb-8 pb-6 border-b-2 border-accent-track">
			<div class="flex items-baseline gap-4 mb-3">
				<span class="font-body text-text-muted text-sm uppercase tracking-widest">Movement</span>
				<div class="flex-1 h-px bg-accent-track"></div>
			</div>
			<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
				{data.movement.name.toUpperCase()}
			</h1>
		</section>

		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Left Column: Visual & Description -->
			<div class="space-y-6">
				<!-- Illustration -->
				{#if data.movement.illustrationPath}
					<div class="relative bg-surface border-t-4 border-t-accent-primary p-8 flex items-center justify-center" style="box-shadow: var(--shadow-elevated);">
						<!-- Corner accents -->
						<div class="absolute top-0 left-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute top-0 right-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute bottom-0 left-0 w-3 h-3 bg-accent-primary"></div>
						<div class="absolute bottom-0 right-0 w-3 h-3 bg-accent-primary"></div>
						
						{#if data.movement.illustrationPath.startsWith('<svg')}
							<div class="illustration w-48 h-48 text-text-muted">
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

				<!-- Description -->
				{#if data.movement.description}
					<section class="bg-surface p-6 border-t-4 border-t-accent-warm" style="box-shadow: var(--shadow-elevated);">
						<h2 class="font-display text-xl text-text-primary tracking-wider mb-3">DESCRIPTION</h2>
						<p class="font-body text-text-secondary leading-relaxed">{data.movement.description}</p>
					</section>
				{/if}
			</div>

			<!-- Right Column: Details, Equipment, Tags -->
			<div class="space-y-6">
				<!-- Stats Grid -->
				<section class="bg-surface border-t-4 border-t-accent-primary p-6" style="box-shadow: var(--shadow-elevated);">
					<h2 class="font-display text-xl text-text-primary tracking-wider mb-6 pb-4 border-b border-accent-track">
						DETAILS
					</h2>
					
					<div class="space-y-4">
						<!-- Target -->
						{#if formatTarget(data.movement)}
							<div class="flex items-center justify-between py-3 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-sm">Default Target</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-2xl text-accent-primary">{data.movement.metadata?.defaultTarget?.value}</span>
									<span class="font-body text-sm text-text-secondary">{data.movement.metadata?.defaultTarget?.unit || ''}</span>
								</div>
							</div>
						{/if}

						<!-- Bilateral Switch Time -->
						{#if data.movement.isBilateral}
							<div class="flex items-center justify-between py-3 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-sm">Switch Sides</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-2xl text-accent-warm">{data.movement.switchSidesDuration}</span>
									<span class="font-body text-sm text-text-secondary">s</span>
								</div>
							</div>
						{/if}

						<!-- Weight Unit -->
						{#if data.movement.type === 'weighted' && data.movement.weightUnit}
							<div class="flex items-center justify-between py-3 border-b border-accent-track/50">
								<span class="font-body text-text-muted uppercase tracking-wider text-sm">Weight Unit</span>
								<span class="font-body text-sm text-accent-primary uppercase">{data.movement.weightUnit}</span>
							</div>
						{/if}

						<!-- Time Per Rep -->
						{#if data.movement.timePerRep && data.movement.type !== 'timed'}
							<div class="flex items-center justify-between py-3">
								<span class="font-body text-text-muted uppercase tracking-wider text-sm">Time Per Rep</span>
								<div class="flex items-baseline gap-1">
									<span class="font-display text-2xl text-accent-secondary">{data.movement.timePerRep}</span>
									<span class="font-body text-sm text-text-secondary">s</span>
								</div>
							</div>
						{/if}
					</div>
				</section>

				<!-- Equipment -->
				{#if data.movement.equipment && data.movement.equipment.length > 0}
					<section class="bg-surface border-t-4 border-t-accent-secondary p-6" style="box-shadow: var(--shadow-elevated);">
						<h2 class="font-display text-xl text-text-primary tracking-wider mb-4">EQUIPMENT</h2>
						<div class="flex flex-wrap gap-2">
							{#each data.movement.equipment as item}
								<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-accent-track text-text-secondary text-sm">
									<Barbell weight="duotone" size={12} class="text-accent-primary" />
									<span class="font-body text-sm">{item}</span>
								</span>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Tags -->
				<div class="flex flex-wrap gap-2">
					{#if data.movement.isBilateral}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent-track text-text-secondary text-sm">
							<ArrowsLeftRight weight="duotone" size={12} class="text-accent-secondary" />
							<span class="font-body text-xs uppercase tracking-wider">Bilateral</span>
						</span>
					{/if}
					{#if data.movement.isCustom}
						<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-accent-primary/30 text-accent-primary text-sm">
							<span class="font-body text-xs uppercase tracking-wider">Custom</span>
						</span>
					{/if}
				<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent-track text-text-secondary text-sm capitalize">
					{#if data.movement.type === 'timed'}
						<Timer weight="duotone" size={12} class="text-accent-primary" />
					{:else if data.movement.type === 'reps'}
						<Stack weight="duotone" size={12} class="text-accent-primary" />
					{:else if data.movement.type === 'weighted'}
						<Barbell weight="duotone" size={12} class="text-accent-primary" />
					{:else}
						<PersonSimple weight="duotone" size={12} class="text-accent-primary" />
					{/if}
					<span class="font-body text-xs uppercase tracking-wider">{data.movement.type}</span>
				</span>
				</div>
			</div>
		</div>

		<!-- Bottom Actions -->
		<section class="mt-12 pt-6 border-t-2 border-accent-track">
			<div class="flex items-center justify-between">
				<button
					onclick={handleBack}
					class="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors font-body uppercase tracking-wider text-sm"
				>
					<ArrowLeft weight="bold" size={14} />
					Back to Library
				</button>
				
				{#if data.user && data.user.id === data.movement.userId}
					<a
						href="/movement/{data.movement.id}/edit"
						class="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white hover:bg-accent-primary-light transition-colors font-display text-xl tracking-widest"
					>
						<PencilSimple weight="bold" size={18} />
						EDIT
					</a>
				{/if}
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer class="border-t-2 border-accent-track mt-16">
		<div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
			<p class="text-text-muted text-sm text-center font-body">
				STRTCHY — MOVE BETTER
			</p>
		</div>
	</footer>
</div>

<style>
	/* Only apply to illustration SVGs, not icons */
	:global(.illustration svg) {
		width: 100%;
		height: 100%;
	}
</style>
