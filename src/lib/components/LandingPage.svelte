<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/theme.svelte';
	import { routineCover } from '$lib/art';
	import {
		ArrowRight,
		Barbell,
		CalendarCheck,
		List,
		Moon,
		Play,
		SlidersHorizontal,
		SpeakerHigh,
		Sun,
		Timer,
		X
	} from 'phosphor-svelte';

	interface RoutineItem {
		id: string;
		name: string;
		description: string | null;
		movementCount: number;
		isCustom: boolean;
	}

	let { routines = [] }: { routines: RoutineItem[] } = $props();

	let mobileMenuOpen = $state(false);

	let primaryTryHref = $derived(
		routines.length > 0 ? `/routine/${routines[0].id}` : '/routines'
	);

	let featuredRoutines = $derived(routines.slice(0, 6));

	const features = [
		{
			num: '01',
			title: 'Guided Bilateral Player',
			description:
				'Automatic left/right side-switching, countdown timers, and rep tracking keep your flow moving without touching the screen.',
			icon: 'timer'
		},
		{
			num: '02',
			title: 'Voice Cues & Audio Pacing',
			description:
				'Spoken transition prompts, halfway markers, and rest alerts let you focus on your breath and alignment instead of watching the clock.',
			icon: 'audio'
		},
		{
			num: '03',
			title: 'Custom Routines & Transient Edits',
			description:
				'Build your own sequences from the movement library, or adjust holds, sets, and rest on the fly for a single session.',
			icon: 'sliders'
		},
		{
			num: '04',
			title: 'Built for Daily Consistency',
			description:
				'Installable offline-ready PWA with 3D movement art, session history, and zero clutter between you and the mat.',
			icon: 'pwa'
		}
	] as const;

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<div class="min-h-screen bg-base text-text-primary flex flex-col">
	<!-- Top Navigation -->
	<header class="sticky top-0 z-50 bg-base/95 backdrop-blur-md border-b border-accent-track">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
			<div class="flex items-center justify-between h-16">
				<a href="/" class="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-150">
					<img src={favicon} alt="" class="w-8 h-8 shrink-0 select-none" />
					<span class="font-display text-2xl tracking-wider text-text-primary leading-none">STRTCHY</span>
				</a>

				<!-- Desktop Nav -->
				<nav class="hidden md:flex items-center gap-2">
					<a
						href="/routines"
						class="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 text-sm font-body font-bold uppercase tracking-wider"
					>
						Browse Routines
					</a>
					<button
						type="button"
						onclick={() => theme.toggle()}
						class="p-2 text-text-secondary hover:text-accent-primary hover:bg-surface transition-all duration-150"
						aria-label="Toggle theme"
						title="Toggle dark/light mode"
					>
						{#if $theme === 'dark'}
							<Sun weight="duotone" size={20} />
						{:else}
							<Moon weight="duotone" size={20} />
						{/if}
					</button>
					<a
						href="/login"
						class="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 text-sm font-body font-bold uppercase tracking-wider"
					>
						Log in
					</a>
					<a
						href="/register"
						class="px-5 py-2.5 bg-accent-primary hover:bg-accent-primary-light text-white transition-all duration-150 font-display text-base tracking-widest uppercase ml-1"
					>
						Get Started
					</a>
				</nav>

				<!-- Mobile Controls -->
				<div class="flex md:hidden items-center gap-2">
					<button
						type="button"
						onclick={() => theme.toggle()}
						class="p-2 text-text-secondary hover:text-accent-primary hover:bg-surface transition-all duration-150"
						aria-label="Toggle theme"
					>
						{#if $theme === 'dark'}
							<Sun weight="duotone" size={20} />
						{:else}
							<Moon weight="duotone" size={20} />
						{/if}
					</button>
					<button
						type="button"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						class="p-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150"
						aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
						aria-expanded={mobileMenuOpen}
					>
						{#if mobileMenuOpen}
							<X weight="bold" size={22} />
						{:else}
							<List weight="duotone" size={22} />
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile Drawer -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-accent-track bg-surface">
				<div class="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-2">
					<a
						href="/routines"
						onclick={closeMobileMenu}
						class="py-3 px-3 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors font-body text-sm font-bold uppercase tracking-wider border-b border-accent-track"
					>
						Browse Routines
					</a>
					<a
						href="/login"
						onclick={closeMobileMenu}
						class="py-3 px-3 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors font-body text-sm font-bold uppercase tracking-wider border-b border-accent-track"
					>
						Log in
					</a>
					<a
						href="/register"
						onclick={closeMobileMenu}
						class="mt-2 py-3.5 px-4 bg-accent-primary hover:bg-accent-primary-light text-white text-center font-display text-lg tracking-widest uppercase transition-colors"
					>
						Get Started
					</a>
				</div>
			</div>
		{/if}
	</header>

	<main class="flex-1">
		<!-- Hero Section -->
		<section class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-14 border-b-2 border-accent-track">
			<div class="space-y-8">
				<div class="space-y-4">
					<div class="flex items-center gap-4">
						<span class="text-accent-warm font-mono text-xs uppercase tracking-widest">
							Guided Mobility &amp; Stretching
						</span>
						<div class="flex-1 h-px bg-accent-track"></div>
						<span class="hidden sm:inline font-mono text-xs text-text-muted uppercase tracking-widest">
							Offline-Ready PWA
						</span>
					</div>

					<h1 class="font-display text-5xl sm:text-7xl text-text-primary tracking-wide leading-none">
						MOVE BETTER.<br />
						<span class="text-accent-primary">EVERY SINGLE DAY.</span>
					</h1>

					<p class="font-body text-base sm:text-lg text-text-secondary max-w-2xl leading-relaxed">
						A focused stretching player with automatic bilateral side-switching, spoken voice cues,
						3D movement art, and zero-friction timers. Step onto the mat and press play—no account
						required to try your first session.
					</p>
				</div>

				<!-- Hero CTAs -->
				<div class="flex flex-wrap items-center gap-4">
					<a
						href={primaryTryHref}
						class="inline-flex items-center gap-3 px-8 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
						style="box-shadow: var(--shadow-floating);"
					>
						<Play weight="fill" size={18} />
						Try a Routine Now
						<ArrowRight weight="bold" size={18} />
					</a>
					<a
						href="/register"
						class="inline-flex items-center gap-2 px-8 py-4 bg-surface text-text-primary hover:text-accent-primary transition-colors border-2 border-accent-track hover:border-accent-primary font-display text-lg tracking-widest uppercase"
					>
						Create Free Account
					</a>
				</div>

				<!-- Athletic Spec Bar -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-accent-track">
					<div>
						<span class="block font-display text-3xl text-accent-primary">{routines.length || 6}</span>
						<span class="text-text-muted text-xs font-mono uppercase tracking-wider">Built-in routines</span>
					</div>
					<div>
						<span class="block font-display text-3xl text-accent-secondary">L / R</span>
						<span class="text-text-muted text-xs font-mono uppercase tracking-wider">Bilateral pacing</span>
					</div>
					<div>
						<span class="block font-display text-3xl text-accent-warm">VOICE</span>
						<span class="text-text-muted text-xs font-mono uppercase tracking-wider">Hands-free cues</span>
					</div>
					<div>
						<span class="block font-display text-3xl text-text-primary">PWA</span>
						<span class="text-text-muted text-xs font-mono uppercase tracking-wider">Works offline</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Feature Highlights -->
		<section class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-14 border-b border-accent-track">
			<div class="flex items-center justify-between mb-8 pb-4 border-b border-accent-track">
				<h2 class="font-display text-3xl sm:text-4xl text-text-primary tracking-wider">
					BUILT FOR THE MAT
				</h2>
				<span class="font-mono text-xs text-text-muted uppercase tracking-widest">04 Core Systems</span>
			</div>

			<div class="grid sm:grid-cols-2 gap-5">
				{#each features as feature}
					<div
						class="relative bg-surface p-6 border-t-4 border-t-accent-primary"
						style="box-shadow: var(--shadow-elevated);"
					>
						<div class="flex items-start justify-between gap-4 mb-4">
							<div class="w-10 h-10 bg-accent-primary/10 flex items-center justify-center shrink-0">
								{#if feature.icon === 'timer'}
									<Timer weight="duotone" size={22} class="text-accent-primary" />
								{:else if feature.icon === 'audio'}
									<SpeakerHigh weight="duotone" size={22} class="text-accent-primary" />
								{:else if feature.icon === 'sliders'}
									<SlidersHorizontal weight="duotone" size={22} class="text-accent-primary" />
								{:else}
									<CalendarCheck weight="duotone" size={22} class="text-accent-primary" />
								{/if}
							</div>
							<span class="font-mono text-xs text-text-muted">{feature.num}</span>
						</div>

						<h3 class="font-title text-lg text-text-primary mb-2">
							{feature.title}
						</h3>
						<p class="font-body text-sm text-text-secondary leading-relaxed">
							{feature.description}
						</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Featured Built-in Routines -->
		<section class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-14 border-b border-accent-track">
			<div class="flex items-center justify-between mb-8 pb-4 border-b border-accent-track">
				<div>
					<h2 class="font-display text-3xl sm:text-4xl text-text-primary tracking-wider">
						FEATURED ROUTINES
					</h2>
					<p class="font-body text-sm text-text-muted mt-1">
						Open any routine and start practicing immediately—no sign-up needed.
					</p>
				</div>
				<a
					href="/routines"
					class="text-text-muted hover:text-accent-primary transition-colors text-sm font-body uppercase tracking-wider shrink-0"
				>
					See all →
				</a>
			</div>

			{#if featuredRoutines.length > 0}
				<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each featuredRoutines as routine}
						<a
							href="/routine/{routine.id}"
							class="group relative bg-surface p-5 hover:-translate-y-0.5 transition-all duration-200 border-t-4 border-t-accent-primary"
							style="box-shadow: var(--shadow-elevated);"
						>
							{#if routineCover(routine)}
								<div class="-mx-5 -mt-5 mb-4 overflow-hidden bg-inset">
									<img
										src={routineCover(routine)}
										alt=""
										loading="lazy"
										class="w-full aspect-[2/1] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
										style="object-position: 50% 70%;"
									/>
								</div>
							{/if}

							<div
								class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
								style="box-shadow: inset 0 0 30px rgba(91, 141, 184, 0.1);"
							></div>

							<div class="flex items-start justify-between gap-3 mb-3">
								<h3 class="font-title text-lg text-text-primary group-hover:text-accent-primary transition-colors leading-tight">
									{routine.name}
								</h3>
							</div>

							{#if routine.description}
								<p class="text-text-muted text-sm line-clamp-2 mb-4 font-body">
									{routine.description}
								</p>
							{:else}
								<div class="mb-4"></div>
							{/if}

							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2 text-text-muted text-sm font-mono">
									<Barbell weight="duotone" size={16} class="text-accent-primary" />
									<span>{routine.movementCount || '?'} moves</span>
								</div>
								<div class="w-8 h-8 flex items-center justify-center bg-accent-primary/10 group-hover:bg-accent-primary transition-colors">
									<Play weight="fill" size={14} class="text-accent-primary group-hover:text-white transition-colors" />
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="bg-surface p-8 border-t-4 border-t-accent-primary text-center" style="box-shadow: var(--shadow-elevated);">
					<p class="text-text-secondary font-body mb-4">Explore our guided mobility and recovery library.</p>
					<a
						href="/routines"
						class="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary text-white hover:bg-accent-primary-light transition-colors font-display text-base tracking-widest uppercase"
					>
						Browse Routines
						<ArrowRight weight="bold" size={16} />
					</a>
				</div>
			{/if}
		</section>

		<!-- Final CTA -->
		<section class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-14">
			<div
				class="bg-surface p-8 sm:p-10 border-t-4 border-t-accent-warm flex flex-col md:flex-row md:items-center md:justify-between gap-6"
				style="box-shadow: var(--shadow-floating);"
			>
				<div class="space-y-2 max-w-xl">
					<span class="font-mono text-xs text-accent-warm uppercase tracking-widest">
						Ready When You Are
					</span>
					<h2 class="font-display text-3xl sm:text-4xl text-text-primary tracking-wide leading-none">
						START YOUR PRACTICE TODAY
					</h2>
					<p class="font-body text-sm sm:text-base text-text-secondary">
						Create a free account to save your practice history, build custom sequences, and keep your
						mobility consistent across devices.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-3 shrink-0">
					<a
						href="/register"
						class="inline-flex items-center gap-2 px-7 py-4 bg-accent-primary text-white hover:bg-accent-primary-light transition-all duration-150 font-display text-lg tracking-widest uppercase"
					>
						Create Free Account
						<ArrowRight weight="bold" size={18} />
					</a>
					<a
						href="/routines"
						class="inline-flex items-center gap-2 px-6 py-4 bg-inset text-text-primary hover:text-accent-primary border-2 border-accent-track hover:border-accent-primary transition-colors font-display text-lg tracking-widest uppercase"
					>
						Browse Routines
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer class="border-t-2 border-accent-track bg-base">
		<div class="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<span class="font-display text-xl tracking-wider text-text-primary">STRTCHY</span>
				<span class="text-accent-track">|</span>
				<span class="text-text-muted text-xs font-mono uppercase tracking-wider">Move Better</span>
			</div>

			<nav class="flex flex-wrap items-center justify-center gap-6 text-xs font-body uppercase tracking-wider text-text-muted">
				<a href="/routines" class="hover:text-accent-primary transition-colors">Routines</a>
				<a href="/login" class="hover:text-accent-primary transition-colors">Log in</a>
				<a href="/register" class="hover:text-accent-primary transition-colors">Get Started</a>
				<a href="/terms" class="hover:text-accent-primary transition-colors">Terms</a>
				<a href="/privacy" class="hover:text-accent-primary transition-colors">Privacy</a>
			</nav>
		</div>
	</footer>
</div>
