<script lang="ts">
	import logo from '$lib/assets/logo.svg';
	import type { Snippet } from 'svelte';

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

<header class="p-6 border-b border-gray-800">
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				{#if backUrl}
					<a
						href={backUrl}
						class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
					>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-5 h-5"
						width="20"
						height="20"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
						/>
					</svg>
						<span class="hidden sm:inline">{backText}</span>
					</a>
				{:else}
					<a href="/" class="flex items-center gap-4 hover:opacity-80 transition-opacity">
						<img src={logo} alt="Strtchy Logo" class="h-10" />
					</a>
				{/if}

				{#if title}
					<div class="flex items-center gap-3">
						<span class="text-gray-600 hidden sm:inline">|</span>
						<div>
							<h1 class="font-semibold text-lg">{title}</h1>
							{#if subtitle}
								<p class="text-gray-400 text-sm hidden sm:block">{subtitle}</p>
							{/if}
						</div>
					</div>
				{:else if !backUrl}
					<div class="hidden sm:block">
						<p class="text-gray-400 text-sm">Your recovery companion</p>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-3">
				{#if children}
					{@render children()}
				{/if}

				{#if !showNav && user}
					<a
						href="/profile"
						class="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors text-xl"
						aria-label="Profile"
					>
						{user.image || '🧘'}
					</a>
				{:else if !showNav && !user}
					<a
						href="/login"
						class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
					>
						Sign in
					</a>
				{/if}

				{#if showNav}
					<nav class="flex items-center gap-2">
						<a
							href="/routines"
							class="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
						>
							Routines
						</a>
						<a
							href="/movements"
							class="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
						>
							Movements
						</a>
						{#if user}
							<a
								href="/profile"
								class="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm flex items-center gap-2"
							>
								<span class="text-lg">{user.image || '🧘'}</span>
							</a>
						{:else}
							<a
								href="/login"
								class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
							>
								Sign in
							</a>
						{/if}
					</nav>
				{/if}
			</div>
		</div>
	</div>
</header>
