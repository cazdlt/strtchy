<script lang="ts">
	import { formatTime } from '$lib/utils/formatting';

	let {
		label = 'Rest',
		duration = 0,
		remainingTime = 0,
		isActive = false,
		isCompleted = false,
		isPreview = false,
		onSkip,
		id = '',
		isPaused = false
	} = $props<{
		label?: string;
		duration: number;
		remainingTime?: number;
		isActive?: boolean;
		isCompleted?: boolean;
		isPreview?: boolean;
		onSkip?: () => void;
		id?: string;
		isPaused?: boolean;
	}>();

	const progress = $derived(duration > 0 ? ((duration - (remainingTime || 0)) / duration) * 100 : 0);
</script>

<div
	id={isActive ? 'active-rest-timer' : id}
	class="flex items-center gap-2 py-2 px-3 rounded-md border transition-all relative overflow-hidden {isActive
		? 'border-blue-500/30 bg-blue-500/5'
		: 'border-transparent'}"
>
	{#if isActive}
		<div
			class="absolute bottom-0 left-0 h-0.5 bg-blue-500/30 transition-all duration-1000 ease-linear"
			style="width: {progress}%"
		></div>
	{/if}

	<div class="flex items-center gap-2 flex-1 min-h-[24px]">
		{#if isActive || isCompleted}
			<div class="flex-shrink-0">
				{#if isCompleted}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-3.5 h-3.5 text-emerald-500/50">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				{:else}
					<div class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
				{/if}
			</div>
		{/if}

		<span class="text-[10px] font-bold uppercase tracking-widest {isActive ? 'text-blue-200' : 'text-gray-600'}">
			{label}
		</span>

		{#if isActive}
			<span class="text-base font-black text-blue-400 tabular-nums">
				{formatTime(remainingTime || 0)}
			</span>
		{:else if !isCompleted}
			<span class="text-[10px] text-gray-700 font-mono">({formatTime(duration)})</span>
		{/if}
	</div>

	{#if isActive}
		<button
			onclick={onSkip}
			disabled={isPaused}
			class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-colors relative z-10 shadow-sm"
		>
			Skip
		</button>
	{/if}
</div>
