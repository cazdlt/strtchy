<script lang="ts">
	import type { Snippet } from 'svelte';
	import { theme } from '$lib/theme.svelte';
	import { ArrowLeft, Sun, Moon, List, User } from 'phosphor-svelte';

	let {
		user = null,
		showNav = true,
		backUrl = null,
		backText = 'Back',
		title = null,
		subtitle = null,
		children = undefined
	}: {
		user?: { id: string; name?: string; image?: string } | null;
		showNav?: boolean;
		backUrl?: string | null;
		backText?: string;
		title?: string | null;
		subtitle?: string | null;
		children?: Snippet | undefined;
	} = $props();
</script>

<header class="sticky top-0 z-50 bg-base/95 backdrop-blur-md border-b border-accent-track">
	<div class="max-w-5xl ml-auto mr-auto pl-4 pr-4 sm:pl-6 sm:pr-6">
		<div class="flex items-center justify-between h-16">
			<div class="flex items-center gap-4">
				{#if backUrl}
					<a
						href={backUrl}
						class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors duration-150 group"
					>
						<ArrowLeft weight="duotone" size={20} class="transform group-hover:-translate-x-0.5 transition-transform duration-150" />
						<span class="hidden sm:inline font-display uppercase tracking-wider text-sm">{backText}</span>
					</a>
				{:else}
					<a href="/" class="flex items-center hover:opacity-80 transition-opacity duration-150">
						<span class="font-display text-xl font-bold tracking-wider text-text-primary">STRTCHY</span>
					</a>
				{/if}

				{#if title}
					<div class="flex items-center gap-3">
						<span class="text-accent-track hidden sm:inline">|</span>
						<div>
							<h1 class="font-display font-bold text-lg tracking-wide text-text-primary">{title}</h1>
							{#if subtitle}
								<p class="text-text-muted text-sm hidden sm:block font-body">{subtitle}</p>
							{/if}
						</div>
					</div>
				{:else if !backUrl}
					<div class="hidden sm:block">
						<p class="text-text-secondary text-xs font-body uppercase tracking-wider">Your recovery companion</p>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if children}
					{@render children()}
				{/if}

				<!-- Theme Toggle -->
				<button
					onclick={() => theme.toggle()}
					class="p-2 text-text-secondary hover:text-accent-blue hover:bg-surface transition-all duration-150"
					aria-label="Toggle theme"
					title="Toggle dark/light mode"
				>
					{#if $theme === 'dark'}
						<Sun weight="duotone" size={20} />
					{:else}
						<Moon weight="duotone" size={20} />
					{/if}
				</button>

				{#if !showNav && user}
					<a
						href="/profile"
						class="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent-blue hover:bg-surface transition-all duration-150"
						aria-label="Profile"
					>
						<User weight="duotone" size={20} />
					</a>
				{:else if !showNav && !user}
					<a
						href="/login"
						class="px-4 py-2 bg-accent-blue hover:bg-accent-blue-light text-cream-white transition-all duration-150 text-sm font-bold uppercase tracking-wider"
					>
						Sign in
					</a>
				{/if}

				{#if showNav}
					<nav class="hidden md:flex items-center">
						<a
							href="/routines"
							class="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 text-sm font-bold uppercase tracking-wider"
						>
							Routines
						</a>
						<a
							href="/movements"
							class="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 text-sm font-bold uppercase tracking-wider"
						>
							Movements
						</a>
						{#if user}
							<a
								href="/profile"
								class="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150 text-sm font-bold uppercase tracking-wider flex items-center gap-2"
							>
								<User weight="duotone" size={18} />
								<span class="hidden lg:inline">Profile</span>
							</a>
						{:else}
							<a
								href="/login"
								class="px-4 py-2 bg-accent-blue hover:bg-accent-blue-light text-cream-white transition-all duration-150 text-sm font-bold uppercase tracking-wider ml-2"
							>
								Sign in
							</a>
						{/if}
					</nav>

					<!-- Mobile menu button -->
					<button
						class="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface transition-all duration-150"
						onclick={() => {/* Mobile menu logic would go here */}}
						aria-label="Open menu"
					>
						<List weight="duotone" size={20} />
					</button>
				{/if}
			</div>
		</div>
	</div>
</header>
