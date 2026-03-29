<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import PageHeader from '../components/ui/PageHeader.svelte';
	import { ListChecks, Plus, Clock, PersonSimple, Barbell, ArrowRight, Play } from 'phosphor-svelte';

	let { data }: { data: PageData } = $props();
	
	function getGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'MORNING';
		if (hour < 17) return 'AFTERNOON';
		return 'EVENING';
	}
</script>

<svelte:head>
	<title>Strtchy — Your stretching practice</title>
</svelte:head>

<div class="min-h-screen bg-base">
	<PageHeader user={data.user} showNav={false} />

	<main class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
		<!-- Hero Section - 80s Athletic Aesthetic -->
		<section class="pt-8 pb-6 border-b-2 border-accent-track">
			<div class="flex flex-col gap-6">
				<!-- Greeting Block -->
				<div class="space-y-2">
					<div class="flex items-baseline gap-4">
						<span class="text-text-muted text-sm uppercase tracking-widest font-body">{getGreeting()}</span>
						<div class="flex-1 h-px bg-accent-track"></div>
					</div>
					<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
						{#if data.user}
							READY TO MOVE?
						{:else}
							START YOUR PRACTICE
						{/if}
					</h1>
				</div>

				<!-- Stats Bar - Simple Horizontal -->
				{#if data.user}
					<div class="flex items-center gap-8 py-4">
						<div class="flex items-baseline gap-2">
							<span class="font-display text-4xl text-accent-primary">{data.routines.length}</span>
							<span class="text-text-muted text-sm uppercase tracking-wider">routines</span>
						</div>
						<div class="w-px h-8 bg-accent-track"></div>
						<div class="flex items-baseline gap-2">
							<span class="font-display text-4xl text-accent-secondary">{data.recentPractices.length}</span>
							<span class="text-text-muted text-sm uppercase tracking-wider">sessions</span>
						</div>
					</div>
				{:else}
				<!-- Guest CTAs -->
			<div class="flex flex-wrap gap-4 pt-2">
			<a 
				href="/register"
				class="inline-flex items-center gap-2 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-bold"
			>
				<span class="font-display text-lg tracking-widest">SIGN UP</span>
				<ArrowRight weight="bold" size={20} />
			</a>
				<a 
					href="/login" 
					class="inline-flex items-center gap-2 px-8 py-4 bg-surface text-text-primary hover:text-accent-primary transition-colors border-2 border-accent-track hover:border-accent-primary"
				>
					<span class="font-body font-semibold">Sign In</span>
				</a>
			</div>
			{/if}
			</div>
		</section>

		<!-- Ready Routines - Primary Focus -->
		<section class="py-10">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<h2 class="font-display text-3xl text-text-primary tracking-wider">
					PICK A ROUTINE
				</h2>
				<a
					href="/routines"
					class="text-text-muted hover:text-accent-primary transition-colors text-sm font-body uppercase tracking-wider"
				>
					See all →
				</a>
			</div>
			
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.routines.slice(0, 6) as routine}
					<a
						href="/routine/{routine.id}"
						class="group relative bg-surface p-5 hover:-translate-y-0.5 transition-all duration-200 border-t-4 border-t-accent-primary"
						style="box-shadow: var(--shadow-elevated);"
					>
						<!-- Blue glow on hover -->
						<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style="box-shadow: inset 0 0 30px rgba(91, 141, 184, 0.1);"></div>
						
						<div class="flex items-start justify-between gap-3 mb-3">
							<h3 class="font-title text-lg text-text-primary group-hover:text-accent-primary transition-colors leading-tight">
								{routine.name}
							</h3>
							{#if routine.isCustom}
								<span class="shrink-0 text-xs px-2 py-0.5 bg-surface-elevated text-text-muted font-mono">Yours</span>
							{/if}
						</div>
						
						{#if routine.description}
							<p class="text-text-muted text-sm line-clamp-2 mb-4">
								{routine.description}
							</p>
						{:else}
							<div class="mb-4"></div>
						{/if}
						
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-text-muted text-sm">
								<Barbell weight="duotone" size={16} class="text-accent-primary" />
								<span>{routine.movementCount || '?'} moves</span>
							</div>
						<div class="w-8 h-8 flex items-center justify-center bg-accent-primary/10 group-hover:bg-accent-primary transition-colors">
							<Play weight="fill" size={14} class="text-accent-primary group-hover:text-text-primary transition-colors" />
						</div>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- Recent Activity - Streamlined -->
		<section class="py-10 border-t border-accent-track">
			<h2 class="font-display text-3xl text-text-primary tracking-wider mb-6 pb-4 border-b border-accent-track">
				RECENT ACTIVITY
			</h2>
			
			{#if data.recentPractices.length === 0}
				<div class="bg-surface p-8 text-center" style="box-shadow: var(--shadow-elevated);">
					<p class="text-text-secondary">No sessions yet. Pick a routine to start.</p>
				</div>
			{:else}
				<div class="space-y-0">
					{#each data.recentPractices.slice(0, 5) as practice, index}
						<a
							href="/practice/{practice.id}{practice.duration ? '/summary' : ''}"
							class="group flex items-center gap-4 p-4 bg-surface hover:bg-surface-elevated transition-colors duration-150"
							class:border-b={index < Math.min(data.recentPractices.length, 5) - 1}
							class:border-accent-track={index < Math.min(data.recentPractices.length, 5) - 1}
							style={index === 0 ? 'box-shadow: var(--shadow-elevated);' : ''}
						>
							<div class="w-10 h-10 bg-surface-elevated flex items-center justify-center shrink-0">
								<span class="font-mono text-sm text-accent-primary">{String(index + 1).padStart(2, '0')}</span>
							</div>
							
							<div class="flex-1 min-w-0">
								<p class="font-title text-text-primary group-hover:text-accent-primary transition-colors truncate">
									{practice.routineName}
								</p>
								<p class="text-text-muted text-sm">{practice.startedAt}</p>
							</div>
							
							{#if practice.duration}
								<div class="flex items-center gap-2 shrink-0">
									<Clock weight="duotone" size={16} class="text-accent-primary" />
									<span class="font-mono text-sm text-accent-primary">{formatDuration(practice.duration)}</span>
								</div>
							{:else}
								<span class="shrink-0 text-xs text-accent-secondary flex items-center gap-1">
									<span class="w-1.5 h-1.5 bg-accent-secondary animate-pulse"></span>
									In progress
								</span>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Quick Actions - Horizontal row -->
		{#if data.user}
			<section class="py-10 border-t border-accent-track">
				<h2 class="font-display text-3xl text-text-primary tracking-wider mb-6 pb-4 border-b border-accent-track">
					QUICK ACTIONS
				</h2>
				
				<div class="flex flex-wrap gap-3">
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
							<span class="block text-text-muted text-xs">Add an exercise</span>
						</div>
						<Plus weight="bold" size={16} class="text-text-muted group-hover:text-accent-primary transition-colors ml-2" />
					</a>

					<a
						href="/routine/create"
						class="group inline-flex items-center gap-3 px-5 py-3 bg-surface hover:bg-surface-elevated transition-colors"
						style="box-shadow: var(--shadow-elevated);"
					>
						<div class="w-10 h-10 bg-accent-primary/10 flex items-center justify-center">
							<ListChecks weight="duotone" size={20} class="text-accent-primary" />
						</div>
						<div class="text-left">
							<span class="block font-title text-text-primary text-sm uppercase tracking-wider">New routine</span>
							<span class="block text-text-muted text-xs">Build a sequence</span>
						</div>
						<Plus weight="bold" size={16} class="text-text-muted group-hover:text-accent-primary transition-colors ml-2" />
					</a>
				</div>
			</section>
		{/if}

		<!-- Movement Library - Compact preview -->
		<section class="py-10 border-t border-accent-track">
			<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
				<h2 class="font-display text-3xl text-text-primary tracking-wider">
					MOVEMENT LIBRARY
				</h2>
				<a
					href="/movements"
					class="text-text-muted hover:text-accent-primary transition-colors text-sm font-body uppercase tracking-wider"
				>
					Browse {data.movements.length} →
				</a>
			</div>
			
			<div class="flex flex-wrap gap-2">
				{#each data.movements.slice(0, 12) as movement}
					<a
						href="/movement/{movement.id}"
						class="group inline-flex items-center gap-2 px-3 py-2 bg-surface hover:bg-surface-elevated transition-colors text-sm border border-accent-track hover:border-accent-primary"
					>
						<PersonSimple weight="duotone" size={14} class="text-accent-primary" />
						<span class="text-text-secondary group-hover:text-text-primary transition-colors">{movement.name}</span>
						{#if movement.isBilateral}
							<span class="text-xs text-accent-secondary">L/R</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	</main>

	<!-- Footer - minimal -->
	<footer class="border-t-2 border-accent-track mt-auto">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
			<p class="text-text-muted text-sm text-center font-body">
				STRTCHY — MOVE BETTER
			</p>
		</div>
	</footer>
</div>
