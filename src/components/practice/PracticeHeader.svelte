<script lang="ts">
	import { theme } from '$lib/theme.svelte';
	import { Sun, Moon } from 'phosphor-svelte';

	let {
		routineName = '',
		totalSets = 0,
		completedSets = 0,
		duration = 0,
		currentMovementIndex = 0,
		totalMovements = 0,
		isPreview = false,
		onExit = () => {},
		onSettings = () => {}
	} = $props<{
		routineName?: string;
		totalSets?: number;
		completedSets?: number;
		duration?: number;
		currentMovementIndex?: number;
		totalMovements?: number;
		isPreview?: boolean;
		onExit?: () => void;
		onSettings?: () => void;
	}>();

	const progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);

	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<header class="sticky top-0 z-40 w-full border-b border-accent-track bg-base/95 backdrop-blur-md">
	<!-- Thin progress bar at the very top -->
	<div class="h-1 w-full bg-surface">
		<div
			class="h-full bg-success transition-all duration-500 ease-out"
			style="width: {progress}%"
		></div>
	</div>

	<div class="mx-auto max-w-4xl px-3 sm:px-4 h-16 flex items-center justify-between gap-4">
		<!-- Left: Exit/Back -->
		<div class="flex-shrink-0 w-10">
			<button
				onclick={onExit}
				class="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors active:scale-95"
				aria-label={isPreview ? 'Back' : 'Exit practice'}
			>
				{#if isPreview}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-6 h-6"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-6 h-6"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{/if}
			</button>
		</div>

		<!-- Center: Routine Info & Timer -->
		<div class="flex flex-col items-center text-center min-w-0 flex-1">
			<h1 class="text-xs font-semibold text-text-muted uppercase tracking-widest truncate w-full mb-0.5">
				{routineName}
			</h1>
			<div class="flex items-center gap-2 sm:gap-3">
				{#if totalMovements > 0}
					<span class="text-[10px] font-bold text-text-secondary bg-surface px-1.5 py-0.5 uppercase tracking-wider">
						{currentMovementIndex + 1}<span class="text-text-muted mx-0.5">/</span>{totalMovements}
					</span>
					<span class="h-3 w-px bg-accent-track"></span>
				{/if}
				{#if !isPreview}
					<span class="text-xl font-bold font-mono tracking-tight text-text-primary tabular-nums">
						{formatDuration(duration)}
					</span>
					<span class="h-3 w-px bg-accent-track"></span>
				{/if}
				<span class="text-xs font-bold text-success tabular-nums">
					{completedSets}<span class="text-text-muted mx-0.5">/</span>{totalSets} <span class="text-[10px] uppercase tracking-wider text-text-muted ml-0.5">Sets</span>
				</span>
			</div>
		</div>

		<!-- Right: Theme toggle + Settings -->
		<div class="flex-shrink-0 flex items-center gap-1 justify-end">
			<button
				onclick={() => theme.toggle()}
				class="p-2 text-text-secondary hover:text-accent-primary hover:bg-surface-elevated transition-all duration-150"
				aria-label="Toggle theme"
				title="Toggle dark/light mode"
			>
				{#if $theme === 'dark'}
					<Sun weight="duotone" size={20} />
				{:else}
					<Moon weight="duotone" size={20} />
				{/if}
			</button>
			{#if !isPreview}
				<button
					onclick={onSettings}
					class="p-2 -mr-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors active:scale-95"
					aria-label="Settings"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="w-6 h-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
						/>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
</header>
