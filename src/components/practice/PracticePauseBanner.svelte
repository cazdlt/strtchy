<script lang="ts">
	let { show, onResume } = $props<{
		show: boolean;
		onResume: () => void;
	}>();
</script>

{#if show}
	<div class="fixed top-0 left-0 right-0 z-50 bg-warning/90 backdrop-blur-sm border-b border-warning-light shadow-lg" style="box-shadow: var(--shadow-elevated);">
		<div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-base">
					<path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
				</svg>
				<span class="font-title font-bold text-base">Workout Paused</span>
			</div>
			<button
				onclick={onResume}
				class="px-4 py-1.5 bg-accent-primary hover:bg-accent-primary-light text-white text-sm font-body font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
					<path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
				</svg>
				Resume
			</button>
		</div>
	</div>
{/if}
