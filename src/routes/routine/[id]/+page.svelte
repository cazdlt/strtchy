<script lang="ts">
	import { formatDuration } from '$lib/utils/formatting';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';

	let { data }: { data: PageData } = $props();

	let showConfirm = $state(false);

	const totalSets = $derived(
		data.routine.movements.reduce((sum: number, rm: any) => {
			return sum + (rm.isBilateral ? rm.sets * 2 : rm.sets);
		}, 0)
	);

	function handleBack() {
		window.location.href = '/routines';
	}
</script>

<svelte:head>
	<title>{data.routine.name} - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white pb-32">
	<PracticeHeader
		routineName={data.routine.name}
		{totalSets}
		completedSets={0}
		currentMovementIndex={0}
		totalMovements={data.routine.movements.length}
		isPreview={true}
		onExit={handleBack}
		onSettings={() => {}}
	/>

	<main class="max-w-4xl mx-auto p-4 space-y-6">
		<!-- Routine Overview Card -->
		<div class="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<h1 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
							{data.routine.name}
						</h1>
						{#if data.user && data.user.id === data.routine.userId}
							<a
								href="/routine/{data.routine.id}/edit"
								class="p-2 text-gray-500 hover:text-white transition-colors"
								aria-label="Edit routine"
							>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
									<path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
								</svg>
							</a>
						{/if}
					</div>
					<p class="text-gray-400 leading-relaxed">{data.routine.description || 'No description provided.'}</p>
				</div>
				
				<div class="grid grid-cols-2 gap-3 flex-shrink-0">
					{#if data.estimatedDuration}
						<div class="bg-gray-900/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px]">
							<span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Time</span>
							<span class="text-lg font-bold font-mono text-emerald-400">
								~{data.estimatedDuration >= 60 ? Math.round(data.estimatedDuration / 60) + 'm' : data.estimatedDuration + 's'}
							</span>
						</div>
					{/if}
					<div class="bg-gray-900/50 border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px]">
						<span class="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Sets</span>
						<span class="text-lg font-bold font-mono text-blue-400">{totalSets}</span>
					</div>
				</div>
			</div>

			<div class="mt-6 flex flex-wrap gap-2">
				{#if data.routine.autoAdvance}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
							<path fill-rule="evenodd" d="M15.312 11.424a1 1 0 010 1.152l-5.996 5.718a1 1 0 01-1.634-.768v-11.45a1 1 0 011.634-.768l5.996 5.718z" clip-rule="evenodd" />
						</svg>
						Auto-play
					</span>
				{/if}
				{#if data.routine.audioEnabled}
					<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-bold">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
							<path d="M10 3.75a.75.75 0 00-1.264-.546L5.203 6.48H3.5a1.75 1.75 0 00-1.75 1.75v3.5c0 .966.784 1.75 1.75 1.75h1.703l3.533 3.276a.75.75 0 001.264-.546V3.75z" />
						</svg>
						Audio
					</span>
				{/if}
				{#if data.equipment && data.equipment.length > 0}
					{#each data.equipment as item}
						<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-700/50 text-gray-300 border border-white/5 rounded-full text-xs font-bold">
							📦 {item}
						</span>
					{/each}
				{/if}
			</div>
		</div>

		<div class="space-y-4">
			<h2 class="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Timeline</h2>
			
			{#each data.routine.movements as rm, index (rm.id)}
				<MovementBlock
					movementIndex={index}
					routineMovementId={rm.id}
					movementName={rm.movement.name}
					movementType={rm.movement.type}
					description={rm.movement.description}
					targetValue={rm.target.value}
					sets={rm.sets}
					isBilateral={rm.isBilateral}
					switchSidesDuration={rm.switchSidesDuration}
					weight={rm.weight}
					weightUnit={rm.weightUnit}
					notes={rm.notes}
					isActive={false}
					isPreview={true}
					completedSets={new Set()}
					onSetComplete={() => {}}
					onNotesChange={() => {}}
					restBetweenSetsDuration={data.routine.restBetweenSets}
				/>
			{/each}
		</div>
	</main>

	<!-- Fixed bottom button -->
	<div class="fixed bottom-0 left-0 right-0 p-6 bg-gray-950/80 border-t border-white/5 backdrop-blur-xl z-30">
		<div class="max-w-4xl mx-auto">
			<form method="POST" action="?/startPractice" use:enhance>
				{#if showConfirm}
					<div class="flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
						<button
							type="button"
							onclick={() => (showConfirm = false)}
							class="flex-1 bg-gray-800 hover:bg-gray-700 text-white h-14 rounded-2xl font-bold transition-all active:scale-95"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white h-14 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
						>
							Yes, Let's Go!
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => (showConfirm = true)}
						class="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] hover:bg-right text-white h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
					>
						Start Practice
					</button>
				{/if}
			</form>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background: #0a0a0a;
	}
</style>

