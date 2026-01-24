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

	const progress = duration > 0 ? (remaining / duration) * 100 : 0;

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if show}
	<div class="fixed left-0 right-0 z-50 bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90 backdrop-blur-lg border-b border-indigo-500/30 shadow-lg" style="height: 80px; top: 88px;">
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
							class="text-indigo-500/30"
						/>
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="url(#gradient)"
							stroke-width="2.5"
							stroke-dasharray="175.9"
							stroke-dashoffset={175.9 - (175.9 * progress) / 100}
							stroke-linecap="round"
							class="drop-shadow-lg"
						/>
						<defs>
							<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stop-color="#6366f1" />
								<stop offset="100%" stop-color="#a855f7" />
							</linearGradient>
						</defs>
					</svg>
					<span class="absolute text-lg font-bold text-white drop-shadow">{formatTime(remaining)}</span>
				</div>
				<div class="flex flex-col">
					<span class="text-white font-semibold text-base">
						{isBetweenMovements ? '🌿 Rest' : '💪 Rest between sets'}
					</span>
					{#if nextExerciseName}
						<span class="text-indigo-200/80 text-sm">Next: {nextExerciseName}</span>
					{/if}
				</div>
			</div>
			<button
				onclick={onSkip}
				class="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-semibold border border-white/20 backdrop-blur transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
			>
				Skip
			</button>
		</div>
	</div>
{/if}
