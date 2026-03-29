<script lang="ts">
	let {
		show,
		settings,
		onSave,
		onCancel,
		isSaving = false,
		error = null
	} = $props<{
		show: boolean;
		settings: {
			autoPlay: boolean;
			audioEnabled: boolean;
			keepAwake: boolean;
		};
		onSave: (settings: any) => void;
		onCancel: () => void;
		isSaving?: boolean;
		error?: string | null;
	}>();

	// svelte-ignore state_referenced_locally
	let localSettings = $state({
		autoPlay: settings.autoPlay,
		audioEnabled: settings.audioEnabled,
		keepAwake: settings.keepAwake
	});

	$effect(() => {
		localSettings = {
			autoPlay: settings.autoPlay,
			audioEnabled: settings.audioEnabled,
			keepAwake: settings.keepAwake
		};
	});

	function handleSave() {
		onSave(localSettings);
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-base/95 backdrop-blur z-50 flex items-center justify-center p-4">
		<div class="bg-surface border-t-4 border-t-accent-primary max-w-md w-full" style="box-shadow: var(--shadow-floating);">
			<div class="p-6">
				<h2 class="text-2xl font-display text-text-primary tracking-wider mb-6">Practice Settings</h2>

				<div class="space-y-6">
					{#if error}
						<div class="p-3 bg-error/20 border border-error">
							<p class="text-error text-sm">{error}</p>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<div>
							<p class="text-text-primary font-title font-bold">Auto-play</p>
							<p class="text-text-secondary text-sm font-body">Automatically advance to next set</p>
						</div>
					<button
						onclick={() => (localSettings.autoPlay = !localSettings.autoPlay)}
						aria-label="Toggle auto-play"
						class="w-12 h-7 transition-colors {localSettings.autoPlay
								? 'bg-accent-primary'
								: 'bg-accent-track'} relative"
						>
							<div
								class="w-5 h-5 bg-white absolute top-1 transition-transform {localSettings.autoPlay
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="text-text-primary font-title font-bold">Audio cues</p>
							<p class="text-text-secondary text-sm font-body">Play sounds for timer and completion</p>
						</div>
					<button
						onclick={() => (localSettings.audioEnabled = !localSettings.audioEnabled)}
						aria-label="Toggle audio cues"
						class="w-12 h-7 transition-colors {localSettings.audioEnabled
								? 'bg-accent-primary'
								: 'bg-accent-track'} relative"
						>
							<div
								class="w-5 h-5 bg-white absolute top-1 transition-transform {localSettings.audioEnabled
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="text-text-primary font-title font-bold">Keep screen awake</p>
							<p class="text-text-secondary text-sm font-body">Prevent screen from turning off</p>
						</div>
					<button
						onclick={() => (localSettings.keepAwake = !localSettings.keepAwake)}
						aria-label="Toggle keep screen awake"
						class="w-12 h-7 transition-colors {localSettings.keepAwake
								? 'bg-accent-primary'
								: 'bg-accent-track'} relative"
						>
							<div
								class="w-5 h-5 bg-white absolute top-1 transition-transform {localSettings.keepAwake
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>
				</div>

				<div class="flex gap-3 mt-8">
					<button
						onclick={onCancel}
						class="flex-1 bg-surface-elevated hover:bg-accent-track text-text-primary py-3 px-6 font-display text-lg tracking-widest uppercase transition-colors border-2 border-accent-track"
					>
						Cancel
					</button>
					<button
						onclick={handleSave}
						disabled={isSaving}
						class="flex-1 bg-accent-primary hover:bg-accent-primary-light text-white py-3 px-6 font-display text-lg tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if isSaving}
							<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{/if}
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
