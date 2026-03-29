<script lang="ts">
	let { completedSets, totalSets, onCompleteWorkout, isCompletingWorkout = false, onTogglePause = () => {}, isPaused = false } = $props<{
		completedSets: number;
		totalSets: number;
		onCompleteWorkout?: () => void;
		isCompletingWorkout?: boolean;
		onTogglePause?: () => void;
		isPaused?: boolean;
	}>();

	const progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);
	const allComplete = $derived(completedSets >= totalSets);
</script>

<div class="fixed bottom-0 left-0 right-0 bg-gray-950/95 border-t border-gray-800 backdrop-blur z-50">
	<div class="max-w-4xl mx-auto p-4">
		<div class="flex items-center justify-between mb-3 text-sm">
			<span class="text-gray-400">
				{completedSets} / {totalSets} sets • {Math.round(progress)}%
			</span>
		</div>

		<div class="h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
			<div
				class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
				style="width: {progress}%"
			></div>
		</div>

		<div class="flex gap-3">
			<!-- Pause/Resume Button -->
			<button
				onclick={onTogglePause}
				class="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl {isPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'} transition-all"
				aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
			>
				{#if isPaused}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
						<path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
						<path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
					</svg>
				{/if}
			</button>

			<button
				onclick={onCompleteWorkout}
				disabled={isCompletingWorkout || isPaused}
				class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white h-14 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if isCompletingWorkout}
					<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				{/if}
				{isCompletingWorkout ? 'Completing...' : 'Complete Workout'}
			</button>
		</div>
	</div>
</div>
