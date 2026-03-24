<script lang="ts">
	import { formatTime } from '$lib/utils/formatting';

	let {
		remainingTime,
		totalDuration,
		type,
		nextExerciseName = '',
		onSkip,
		isActive = false,
		isCompleted = false,
		isPaused = false
	} = $props<{
		remainingTime: number;
		totalDuration: number;
		type: 'between-sets' | 'between-movements';
		nextExerciseName?: string;
		onSkip?: () => void;
		isActive?: boolean;
		isCompleted?: boolean;
		isPaused?: boolean;
	}>();

	const label = $derived(type === 'between-sets' ? 'Rest between sets' : 'Rest before next exercise');
	const icon = $derived(type === 'between-sets' ? '💪' : '🌿');
	const progress = $derived(totalDuration > 0 ? ((totalDuration - remainingTime) / totalDuration) * 100 : 0);
</script>

<div
	id={isActive ? "active-rest-timer" : ""}
	class="border rounded-lg overflow-hidden mb-4 relative transition-all {isActive
		? 'bg-blue-500/5 border-blue-500 shadow-lg shadow-blue-500/10'
		: isCompleted
		? 'bg-gray-900/20 border-gray-800 opacity-60'
		: 'bg-gray-800/20 border-gray-700 border-dashed opacity-50'}"
>
	<div class="p-4 flex items-center justify-between relative z-10">
		<div class="flex items-center gap-4">
			<span class="text-2xl">{icon}</span>
			<div>
				<div class="flex items-center gap-3">
					<span class="font-semibold {isActive ? 'text-white' : 'text-gray-400'}">{label}</span>
					{#if isActive}
						<span class="text-3xl font-bold text-blue-400 w-16 text-center tabular-nums">{formatTime(remainingTime)}</span>
					{:else if !isCompleted}
						<span class="text-gray-500">({formatTime(totalDuration)})</span>
					{/if}
				</div>
				{#if type === 'between-movements' && nextExerciseName}
					<div class="text-gray-400 text-sm mt-1">Next: {nextExerciseName}</div>
				{/if}
			</div>
		</div>
		{#if isActive && onSkip}
			<button
				onclick={onSkip}
				disabled={isPaused}
				class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
				aria-label="Skip rest"
			>
				Skip
			</button>
		{:else if isCompleted}
			<div class="text-emerald-500">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			</div>
		{/if}
	</div>

	{#if isActive}
		<!-- Progress bar background -->
		<div class="absolute bottom-0 left-0 w-full h-1 bg-gray-700/50">
			<!-- Progress fill -->
			<div
				class="h-full bg-blue-500 transition-all duration-1000 ease-linear"
				style="width: {progress}%"
			></div>
		</div>
	{/if}
</div>
