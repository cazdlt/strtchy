<script lang="ts">
	import { goto } from '$app/navigation';

	let {
		routineName,
		totalSets,
		settings,
		equipment,
		onStart
	} = $props<{
		routineName: string;
		totalSets: number;
		settings: {
			autoPlay: boolean;
			audioEnabled: boolean;
			keepAwake: boolean;
		};
		equipment: string[];
		onStart: () => void;
	}>();

	let routineId = $derived(() => {
		// We need to extract routineId from URL or pass it as prop
		// For now, we'll get it from the parent component
		return '';
	});
</script>

<div class="fixed inset-0 bg-gray-950/95 z-50 flex flex-col items-center justify-center p-6">
	<!-- Back button -->
	<button
		onclick={() => window.history.back()}
		class="absolute top-4 left-4 p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95 z-50"
		aria-label="Back"
	>
		<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
			<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
		</svg>
	</button>
	<div class="text-center max-w-md">
		<div class="mb-8">
			<div class="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/30">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-12 h-12 text-white">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
				</svg>
			</div>
			<h1 class="text-3xl font-bold text-white mb-2">{routineName}</h1>
			<p class="text-gray-400">Ready to begin?</p>
		</div>
		
		<div class="space-y-4 mb-8">
			<div class="flex items-center justify-center gap-6 text-sm text-gray-400">
				<div class="flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
					</svg>
					<span>{totalSets} sets</span>
				</div>
				{#if settings.autoPlay}
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
						</svg>
						<span>Auto-play on</span>
					</div>
				{/if}
				{#if settings.keepAwake}
					<div class="flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
						</svg>
						<span>Screen awake</span>
					</div>
				{/if}
			</div>
			
			{#if equipment.length > 0}
				<div class="mt-6 pt-6 border-t border-gray-800">
					<div class="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
						</svg>
						<span>Equipment needed</span>
					</div>
					<div class="flex flex-wrap justify-center gap-2">
						{#each equipment as item}
							<span class="px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-sm text-gray-300">
								{item}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		
		<button
			onclick={onStart}
			class="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
		>
			Start Practice
		</button>
	</div>
</div>
