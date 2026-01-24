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
	<div class="fixed inset-0 bg-gray-950/95 backdrop-blur z-50 flex items-center justify-center p-4">
		<div class="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-white mb-6">Practice Settings</h2>

				<div class="space-y-6">
					{#if error}
						<div class="p-3 bg-red-900/30 border border-red-700 rounded-lg">
							<p class="text-red-200 text-sm">{error}</p>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<div>
							<p class="text-white font-medium">Auto-play</p>
							<p class="text-gray-400 text-sm">Automatically advance to next set</p>
						</div>
						<button
							onclick={() => (localSettings.autoPlay = !localSettings.autoPlay)}
							class="w-12 h-7 rounded-full transition-colors {localSettings.autoPlay
								? 'bg-blue-600'
								: 'bg-gray-600'} relative"
						>
							<div
								class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform {localSettings.autoPlay
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="text-white font-medium">Audio cues</p>
							<p class="text-gray-400 text-sm">Play sounds for timer and completion</p>
						</div>
						<button
							onclick={() => (localSettings.audioEnabled = !localSettings.audioEnabled)}
							class="w-12 h-7 rounded-full transition-colors {localSettings.audioEnabled
								? 'bg-blue-600'
								: 'bg-gray-600'} relative"
						>
							<div
								class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform {localSettings.audioEnabled
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<p class="text-white font-medium">Keep screen awake</p>
							<p class="text-gray-400 text-sm">Prevent screen from turning off</p>
						</div>
						<button
							onclick={() => (localSettings.keepAwake = !localSettings.keepAwake)}
							class="w-12 h-7 rounded-full transition-colors {localSettings.keepAwake
								? 'bg-blue-600'
								: 'bg-gray-600'} relative"
						>
							<div
								class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform {localSettings.keepAwake
									? 'translate-x-6'
									: 'translate-x-1'}"
							></div>
						</button>
					</div>
				</div>

				<div class="flex gap-3 mt-8">
					<button
						onclick={onCancel}
						class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-all"
					>
						Cancel
					</button>
					<button
						onclick={handleSave}
						disabled={isSaving}
						class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
