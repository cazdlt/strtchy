<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import PageHeader from '../components/ui/PageHeader.svelte';
	import { ListChecks, Plus, ArrowRight, Clock, PersonSimple, Barbell, Trophy, Calendar, Sparkle } from 'phosphor-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Strtchy - Your Recovery Companion</title>
</svelte:head>

<div class="min-h-screen bg-base">
	<PageHeader user={data.user} showNav={false} />

	<main>
		<!-- Hero Section - Spacious with Blue Accents -->
		<section class="relative min-h-[70vh] flex items-center ml-8 mr-8 lg:ml-16 lg:mr-16 xl:ml-24 xl:mr-24">
			<!-- Background Gradient -->
			<div class="absolute inset-0 bg-gradient-to-br from-surface-warm via-base to-base"></div>
			
			<!-- Subtle grain texture -->
			<div class="absolute inset-0 opacity-[0.03]" style="background-image: url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E&quot;); background-size: 200px 200px;"></div>
			
			<div class="relative z-10 w-full pl-8 pr-8 lg:pl-12 lg:pr-12 py-24 lg:py-32">
				<div class="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
					<!-- Left: Typography -->
					<div class="space-y-10">
						<!-- Accent badge -->
						<div class="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20">
							<Sparkle weight="fill" size={16} class="text-accent-primary" />
							<span class="text-sm font-medium text-accent-primary uppercase tracking-wider">Recovery Made Simple</span>
						</div>
						
						<!-- Main headline -->
						<h1 class="font-display text-5xl sm:text-6xl lg:text-7xl text-text-primary leading-[0.95]">
							Move Better.
							<span class="text-accent-primary">Feel Stronger.</span>
						</h1>
						
						<!-- Subtitle with breathing room -->
						<p class="text-text-secondary text-lg sm:text-xl max-w-lg leading-relaxed font-body">
							Build a personalized stretching practice. Track your consistency, celebrate progress, and recover like an athlete.
						</p>
						
						<!-- CTA buttons with proper spacing -->
						<div class="flex flex-wrap items-center gap-4 pt-4">
							{#if data.user}
								<a 
									href="/routines" 
									class="group inline-flex items-center gap-3 px-8 py-4 bg-accent-primary text-white font-semibold text-lg hover:bg-accent-primary-light transition-colors duration-200"
								>
									<span>Start Practicing</span>
									<ArrowRight weight="bold" size={20} class="group-hover:translate-x-1 transition-transform" />
								</a>
							{:else}
								<a 
									href="/register" 
									class="group inline-flex items-center gap-3 px-8 py-4 bg-accent-primary text-white font-semibold text-lg hover:bg-accent-primary-light transition-colors duration-200"
								>
									<span>Get Started Free</span>
									<ArrowRight weight="bold" size={20} class="group-hover:translate-x-1 transition-transform" />
								</a>
								<a 
									href="/login" 
									class="inline-flex items-center gap-2 px-6 py-4 text-text-secondary font-medium hover:text-accent-blue transition-colors"
								>
									Sign In
								</a>
							{/if}
						</div>
					</div>
					
					<!-- Right: Stats or decorative element -->
					<div class="hidden lg:block">
						<div class="relative">
							<!-- Decorative blocks - Orange and Blue -->
							<div class="absolute -top-8 -left-8 w-32 h-32 bg-accent-primary/10"></div>
							<div class="absolute -bottom-8 -right-8 w-24 h-24 bg-accent-blue/15"></div>
							
							<!-- Stats card -->
							<div class="relative bg-surface p-10 shadow-floating">
								<div class="grid grid-cols-2 gap-8">
									<div class="space-y-3">
										<Barbell weight="duotone" size={32} class="text-accent-primary" />
										<p class="font-mono text-4xl font-bold text-text-primary">{data.movements.length}</p>
										<p class="text-sm text-text-muted">Movements</p>
									</div>
									<div class="space-y-3">
										<ListChecks weight="duotone" size={32} class="text-accent-secondary" />
										<p class="font-mono text-4xl font-bold text-text-primary">{data.routines.length}</p>
										<p class="text-sm text-text-muted">Routines</p>
									</div>
								</div>
								
								<div class="mt-8 pt-6 border-t border-accent-track">
									<div class="flex items-center gap-3">
										<Trophy weight="duotone" size={24} class="text-accent-blue" />
										<p class="text-sm text-text-secondary">
											<span class="font-semibold text-text-primary">{data.recentPractices.length}</span> practice sessions completed
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Main Content Area - Generous Spacing -->
		<div class="space-y-20 lg:space-y-28">
			
			{#if data.user}
				<!-- Create Section - Warm Background, Proper Margins -->
				<section class="bg-surface-warm ml-8 mr-8 lg:ml-16 lg:mr-16 xl:ml-24 xl:mr-24 pl-8 pr-8 lg:pl-12 lg:pr-12 py-20 lg:py-28">
					<div>
						<!-- Section header with breathing room -->
						<div class="mb-16">
							<h2 class="font-title text-4xl sm:text-5xl text-text-primary mb-6">
								Create Your Practice
							</h2>
							<p class="text-text-secondary text-lg max-w-2xl">
								Build custom movements and routines tailored to your recovery goals.
							</p>
						</div>
						
						<!-- Create cards - elevated and warm -->
						<div class="grid md:grid-cols-2 gap-8">
							<!-- New Movement Card -->
							<a
								href="/movement/create"
								class="group relative bg-surface p-10 lg:p-12 shadow-floating hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
							>
								<!-- Accent bar -->
								<div class="absolute top-0 left-0 w-full h-1 bg-accent-primary"></div>
								
								<div class="flex flex-col h-full">
									<div class="mb-10">
										<div class="w-16 h-16 bg-accent-primary/10 flex items-center justify-center">
											<PersonSimple weight="duotone" size={32} class="text-accent-primary" />
										</div>
									</div>
									
									<h3 class="font-title text-3xl text-text-primary mb-4 group-hover:text-accent-primary transition-colors">
										New Movement
									</h3>
									
									<p class="text-text-secondary leading-relaxed flex-grow text-lg">
										Add custom stretches and exercises. Define duration, reps, or distance tracking for each movement.
									</p>
									
									<div class="mt-10 flex items-center gap-2 text-accent-primary font-semibold">
										<span>Create Movement</span>
										<Plus weight="bold" size={18} class="group-hover:rotate-90 transition-transform duration-300" />
									</div>
								</div>
							</a>

							<!-- New Routine Card -->
							<a
								href="/routine/create"
								class="group relative bg-surface p-10 lg:p-12 shadow-floating hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
							>
								<!-- Accent bar -->
								<div class="absolute top-0 left-0 w-full h-1 bg-accent-blue"></div>
								
								<div class="flex flex-col h-full">
									<div class="mb-10">
										<div class="w-16 h-16 bg-accent-blue/10 flex items-center justify-center">
											<ListChecks weight="duotone" size={32} class="text-accent-blue" />
										</div>
									</div>
									
									<h3 class="font-title text-3xl text-text-primary mb-4 group-hover:text-accent-blue transition-colors">
										New Routine
									</h3>
									
									<p class="text-text-secondary leading-relaxed flex-grow text-lg">
										Build a custom routine from your movements. Set the order, rest periods, and targets for each exercise.
									</p>
									
									<div class="mt-10 flex items-center gap-2 text-accent-blue font-semibold">
										<span>Create Routine</span>
										<Plus weight="bold" size={18} class="group-hover:rotate-90 transition-transform duration-300" />
									</div>
								</div>
							</a>
						</div>
					</div>
				</section>
			{/if}

			<!-- Ready Routines Section - Clean & Spacious -->
			<section class="ml-8 mr-8 lg:ml-16 lg:mr-16 xl:ml-24 xl:mr-24 pl-8 pr-8 lg:pl-12 lg:pr-12">
				<!-- Section header with proper spacing -->
				<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
					<div>
						<h2 class="font-title text-4xl sm:text-5xl text-text-primary mb-4">
							Ready Routines
						</h2>
						<p class="text-text-secondary text-lg">
							Pre-built routines to get you started quickly.
						</p>
					</div>
					
					<a
						href="/routines"
						class="group inline-flex items-center gap-2 text-accent-blue font-semibold hover:text-accent-blue-light transition-colors"
					>
						<span>Browse all routines</span>
						<ArrowRight weight="bold" size={18} class="group-hover:translate-x-1 transition-transform" />
					</a>
				</div>
				
				<!-- Routines grid with breathing room -->
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each data.routines.slice(0, 6) as routine, index}
						<a
							href="/routine/{routine.id}"
							class="group relative bg-surface p-8 lg:p-10 shadow-elevated hover:shadow-floating transition-all duration-300 hover:-translate-y-1"
						>
							<!-- Corner number - Blue -->
							<div class="absolute top-0 right-0 w-14 h-14 bg-accent-blue/10 flex items-center justify-center">
								<span class="font-mono text-base text-accent-blue">{String(index + 1).padStart(2, '0')}</span>
							</div>
							
							<div class="space-y-5">
								<div class="flex items-start justify-between gap-4 pr-10">
									<h3 class="font-title text-2xl text-text-primary group-hover:text-accent-primary transition-colors">
										{routine.name}
									</h3>
									{#if routine.isCustom}
										<span class="shrink-0 text-xs px-3 py-1 bg-accent-primary/10 text-accent-primary font-mono">
											Custom
										</span>
									{/if}
								</div>
								
								{#if routine.description}
									<p class="text-text-secondary text-base line-clamp-2">
										{routine.description}
									</p>
								{/if}
								
								<div class="pt-5 flex items-center justify-between border-t border-accent-track">
									<div class="flex items-center gap-2 text-text-muted">
										<Clock weight="duotone" size={18} />
										<span class="text-sm">View routine</span>
									</div>
									<ArrowRight weight="bold" size={18} class="text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<!-- Movement Library Section - List with breathing room -->
			<section class="bg-surface-warm ml-8 mr-8 lg:ml-16 lg:mr-16 xl:ml-24 xl:mr-24 pl-8 pr-8 lg:pl-12 lg:pr-12 py-20 lg:py-28">
				<div>
					<!-- Section header -->
					<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
						<div>
							<h2 class="font-title text-4xl sm:text-5xl text-text-primary mb-4">
								Movement Library
							</h2>
							<p class="text-text-secondary text-lg">
								Explore exercises and stretches for your practice.
							</p>
						</div>
						
						<a
							href="/movements"
							class="group inline-flex items-center gap-2 text-accent-blue font-semibold hover:text-accent-blue-light transition-colors"
						>
							<span>View all movements</span>
							<ArrowRight weight="bold" size={18} class="group-hover:translate-x-1 transition-transform" />
						</a>
					</div>
					
					<!-- Movement list - clean and spacious -->
					<div class="bg-surface shadow-elevated">
						{#each data.movements.slice(0, 8) as movement, index}
							<a
								href="/movement/{movement.id}"
								class="group flex items-center gap-8 p-8 lg:p-10 border-b border-accent-track last:border-b-0 hover:bg-surface-elevated transition-colors duration-200"
							>
								<!-- Index number - Blue -->
								<div class="hidden sm:block w-16 font-mono text-xl text-accent-blue">
									{String(index + 1).padStart(2, '0')}
								</div>
								
								<!-- Icon or illustration -->
								<div class="w-14 h-14 flex items-center justify-center bg-surface-elevated shrink-0">
									{#if movement.illustrationPath}
										<img src={movement.illustrationPath} alt={movement.name} class="w-12 h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
									{:else}
										<PersonSimple weight="duotone" size={28} class="text-accent-blue group-hover:text-accent-primary transition-colors" />
									{/if}
								</div>
								
								<!-- Content -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-4 mb-2">
										<span class="font-title text-xl text-text-primary group-hover:text-accent-primary transition-colors truncate">
											{movement.name}
										</span>
										{#if movement.isBilateral}
											<span class="shrink-0 text-xs px-3 py-1 bg-accent-blue/10 text-accent-blue font-mono">
												L/R
											</span>
										{/if}
									</div>
									<span class="text-sm text-text-muted uppercase tracking-wider">{movement.type}</span>
								</div>
								
								<!-- Arrow -->
								<ArrowRight weight="bold" size={20} class="text-accent-blue group-hover:text-accent-primary transition-colors shrink-0" />
							</a>
						{/each}
					</div>
				</div>
			</section>

			<!-- Recent Practices Section - Timeline style -->
			<section class="ml-8 mr-8 lg:ml-16 lg:mr-16 xl:ml-24 xl:mr-24 pl-8 pr-8 lg:pl-12 lg:pr-12">
				<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
					<div>
						<h2 class="font-title text-4xl sm:text-5xl text-text-primary mb-4">
							Recent Practices
						</h2>
						<p class="text-text-secondary text-lg">
							Track your consistency and celebrate progress.
						</p>
					</div>
				</div>
				
				{#if data.recentPractices.length === 0}
					<div class="bg-surface p-16 lg:p-20 text-center shadow-elevated">
						<div class="w-24 h-24 mx-auto mb-8 bg-surface-elevated flex items-center justify-center">
							<Barbell weight="duotone" size={48} class="text-accent-blue" />
						</div>
						<p class="text-text-primary font-title text-2xl mb-3">No practices yet</p>
						<p class="text-text-secondary max-w-md mx-auto text-lg">
							Start a routine to track your recovery journey. Every session counts.
						</p>
					</div>
				{:else}
					<div class="bg-surface shadow-elevated">
						{#each data.recentPractices as practice, index}
							<a
								href="/practice/{practice.id}{practice.duration ? '/summary' : ''}"
								class="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 lg:p-10 border-b border-accent-track last:border-b-0 hover:bg-surface-elevated transition-colors duration-200"
							>
								<div class="flex items-center gap-8">
									<!-- Index number - Blue -->
									<div class="w-14 h-14 bg-surface-elevated flex items-center justify-center shrink-0">
										<span class="font-mono text-xl text-accent-blue">{String(index + 1).padStart(2, '0')}</span>
									</div>
									
									<div>
										<p class="font-title text-xl text-text-primary group-hover:text-accent-primary transition-colors mb-2">
											{practice.routineName}
										</p>
										<div class="flex items-center gap-2 text-text-muted text-sm">
											<Calendar weight="duotone" size={16} />
											<span>{practice.startedAt}</span>
										</div>
									</div>
								</div>
								
								<div class="flex items-center gap-8 sm:pl-0 pl-22">
									{#if practice.duration}
										<div class="flex items-center gap-3">
											<Clock weight="duotone" size={20} class="text-accent-blue" />
											<span class="font-mono text-xl text-accent-blue font-semibold">{formatDuration(practice.duration)}</span>
										</div>
									{:else}
										<span class="inline-flex items-center gap-2 text-sm text-warning font-medium">
											<span class="w-2 h-2 rounded-full bg-warning animate-pulse"></span>
											In Progress
										</span>
									{/if}
									<ArrowRight weight="bold" size={20} class="text-accent-blue group-hover:text-accent-primary transition-colors" />
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	</main>

	<!-- Footer spacing -->
	<div class="h-40"></div>
</div>
