<script lang="ts">
	import { formatTime } from '$lib/utils/formatting';

	let {
		label = 'Rest',
		duration = 0,
		remainingTime = 0,
		isActive = false,
		isCompleted = false,
		onSkip,
		isPaused = false
	}: {
		label?: string;
		duration: number;
		remainingTime?: number;
		isActive?: boolean;
		isCompleted?: boolean;
		onSkip?: () => void;
		isPaused?: boolean;
	} = $props();

	const progress = $derived(duration > 0 ? ((duration - (remainingTime || 0)) / duration) * 100 : 0);
</script>

<div
	class="flex items-center gap-2 py-2 px-3 border transition-all relative overflow-hidden {isActive
		? 'border-accent-primary bg-accent-primary/5'
		: 'border-transparent'}"
>
	{#if isActive}
		<div
			class="absolute bottom-0 left-0 h-0.5 bg-accent-primary/30 transition-all duration-1000 ease-linear"
			style="width: {progress}%"
		></div>
	{/if}

	<div class="flex items-center gap-2 flex-1 min-h-[24px]">
		{#if isActive || isCompleted}
			<div class="flex-shrink-0">
				{#if isCompleted}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3.5 h-3.5 text-success/50">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				{:else}
					<div class="w-2 h-2 bg-accent-primary animate-pulse"></div>
				{/if}
			</div>
		{/if}

		<span class="text-[10px] font-bold uppercase tracking-widest {isActive ? 'text-accent-primary' : 'text-text-muted'}">
			{label}
		</span>

		{#if isActive}
			<span class="text-base font-display text-accent-primary tabular-nums">
				{formatTime(remainingTime || 0)}
			</span>
		{:else if !isCompleted}
			<span class="text-[10px] text-text-muted font-mono">({formatTime(duration)})</span>
		{/if}
	</div>

	{#if isActive}
		<button
			onclick={onSkip}
			disabled={isPaused}
			class="bg-accent-primary hover:bg-accent-primary-light disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-primary text-white px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wide transition-colors relative z-10"
		>
			Skip
		</button>
	{/if}
</div>
