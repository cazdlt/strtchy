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
		type: 'between-sets' | 'between-movements' | 'get-ready';
		nextExerciseName?: string;
		onSkip?: () => void;
		isActive?: boolean;
		isCompleted?: boolean;
		isPaused?: boolean;
	}>();

	const label = $derived(
		type === 'get-ready' ? 'Get Ready' :
		type === 'between-sets' ? 'Rest between sets' :
		'Rest before next exercise'
	);
	const icon = $derived(
		type === 'get-ready' ? '🏁' :
		type === 'between-sets' ? '💪' :
		'🌿'
	);
	const progress = $derived(totalDuration > 0 ? ((totalDuration - remainingTime) / totalDuration) * 100 : 0);
</script>

<div
	id={isActive ? "active-rest-timer" : ""}
	class="border overflow-hidden mb-4 relative transition-all {isActive
		? 'bg-accent-primary/5 border-accent-primary'
		: isCompleted
		? 'bg-surface/20 border-accent-track opacity-60'
		: 'bg-surface/20 border-accent-track border-dashed opacity-50'}"
>
	<div class="p-4 flex items-center justify-between relative z-10">
		<div class="flex items-center gap-4">
			<span class="text-2xl">{icon}</span>
			<div>
				<div class="flex items-center gap-3">
					<span class="font-title font-bold {isActive ? 'text-text-primary' : 'text-text-secondary'}">{label}</span>
					{#if isActive}
						<span class="text-3xl font-display text-accent-primary w-16 text-center tabular-nums">{formatTime(remainingTime)}</span>
					{:else if !isCompleted}
						<span class="text-text-muted">({formatTime(totalDuration)})</span>
					{/if}
				</div>
				{#if (type === 'between-movements' || type === 'get-ready') && nextExerciseName}
					<div class="text-text-secondary text-sm mt-1 font-body">Next: {nextExerciseName}</div>
				{/if}
			</div>
		</div>
		{#if isActive && onSkip}
			<button
				onclick={onSkip}
				disabled={isPaused}
				class="bg-accent-primary hover:bg-accent-primary-light disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-primary text-white px-4 py-2 font-display text-lg tracking-widest uppercase transition-colors"
				aria-label="Skip rest"
			>
				Skip
			</button>
		{:else if isCompleted}
			<div class="text-success">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			</div>
		{/if}
	</div>

	{#if isActive}
		<!-- Progress bar background -->
		<div class="absolute bottom-0 left-0 w-full h-1 bg-accent-track">
			<!-- Progress fill -->
			<div
				class="h-full bg-accent-primary transition-all duration-1000 ease-linear"
				style="width: {progress}%"
			></div>
		</div>
	{/if}
</div>
