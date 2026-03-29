<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let {
		show,
		duration,
		onSkip = () => {},
		nextExerciseName = '',
		isBetweenMovements = false
	} = $props<{
		show: boolean;
		duration: number;
		onSkip?: () => void;
		nextExerciseName?: string;
		isBetweenMovements?: boolean;
	}>();

	let timerInterval: ReturnType<typeof setInterval> | null = null;
	// svelte-ignore state_referenced_locally
	let remaining = $state(duration);

	$effect(() => {
		remaining = duration;

		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		if (show && duration > 0) {
			timerInterval = setInterval(() => {
				remaining--;
				if (remaining <= 0) {
					if (timerInterval) {
						clearInterval(timerInterval);
						timerInterval = null;
					}
				}
			}, 1000);
		}
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
	});

	// svelte-ignore state_referenced_locally
	const progress = duration > 0 ? (remaining / duration) * 100 : 0;

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if show}
	<div class="fixed left-0 right-0 z-50 bg-surface border-b border-accent-track" style="height: 80px; top: 88px; box-shadow: var(--shadow-floating);">
		<div class="h-full max-w-4xl mx-auto px-4 flex items-center justify-between">
			<div class="flex items-center gap-4 flex-1">
				<div class="relative w-16 h-16 flex items-center justify-center">
					<svg class="w-16 h-16 transform -rotate-90">
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							class="text-accent-track"
						/>
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-dasharray="175.9"
							stroke-dashoffset={175.9 - (175.9 * progress) / 100}
							stroke-linecap="round"
							class="text-accent-primary"
						/>
					</svg>
					<span class="absolute text-lg font-bold text-text-primary drop-shadow font-display">{formatTime(remaining)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-text-primary font-display text-xl tracking-wider">
						{isBetweenMovements ? 'REST' : 'REST BETWEEN SETS'}
					</span>
					{#if nextExerciseName}
						<span class="text-text-secondary text-sm font-body">Next: {nextExerciseName}</span>
					{/if}
				</div>
			</div>
			<button
				onclick={onSkip}
				class="bg-accent-primary hover:bg-accent-primary-light text-white px-5 py-2.5 font-display text-lg tracking-widest uppercase transition-colors"
			>
				Skip
			</button>
		</div>
	</div>
{/if}
