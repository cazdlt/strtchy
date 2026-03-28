<script lang="ts">
	let {
		show,
		error,
		onFix
	} = $props<{
		show: boolean;
		error: string | null;
		onFix: () => void;
	}>();
</script>

{#if show && error}
	<div 
		class="fixed top-20 left-4 right-4 z-40" 
		onclick={onFix} 
		onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && onFix()} 
		role="button" 
		tabindex="0"
	>
		<div class="bg-yellow-900/80 border border-yellow-600 rounded-xl p-4 flex items-center justify-between cursor-pointer">
			<div class="flex items-center gap-3">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-yellow-400">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
				</svg>
				<span class="text-yellow-200 text-sm">{error}</span>
			</div>
			<button class="text-yellow-400 hover:text-yellow-200 text-sm font-medium">Tap to fix</button>
		</div>
	</div>
{/if}
