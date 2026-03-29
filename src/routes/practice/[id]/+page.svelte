<script lang="ts">
	import { onMount, onDestroy, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { usePractice } from '$lib/composables/usePractice.svelte';
	import { formatTime } from '$lib/utils/formatting';
	import { countCompletedMovementSets } from '$lib/utils/practiceHelpers';

	// Components
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import InlineRestTimer from '../../../components/practice/InlineRestTimer.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';
	import PracticeFooter from '../../../components/practice/PracticeFooter.svelte';
	import PracticeSettings from '../../../components/practice/PracticeSettings.svelte';
	import PracticePauseBanner from '../../../components/practice/PracticePauseBanner.svelte';
	import StartPracticeOverlay from '../../../components/practice/StartPracticeOverlay.svelte';
	import WakeLockWarning from '../../../components/practice/WakeLockWarning.svelte';
	import AddMovementModal from '../../../components/practice/AddMovementModal.svelte';

	let { data } = $props<{ data: PageData }>();

	// Initialize practice state
	const practice = usePractice(data);

	// Provide to child components via context
	setContext('practice', practice);

	// Local UI state
	let showSettings = $state(false);
	let showAddMovementModal = $state(false);

	// Handler for starting practice
	function handleStartPractice() {
		practice.startPractice();
	}

	// Cleanup on destroy
	onDestroy(() => {
		practice.cleanup();
	});

	// Derived values for UI
	let firstMovementCompleted = $derived(
		data.allRoutineMovements.length > 0
			? countCompletedMovementSets(data.allRoutineMovements[0].id, practice.completedSets, practice.skippedSets) > 0
			: false
	);
</script>

<svelte:head>
	<title>Practice - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary">
	{#if !practice.hasStarted && !practice.isReadOnly}
		<StartPracticeOverlay
			routineName={data.practice.routine.name}
			totalSets={practice.totalSets}
			settings={practice.settings}
			equipment={data.equipment}
			onStart={handleStartPractice}
		/>
	{/if}

	<WakeLockWarning
		show={practice.hasStarted}
		error={practice.wakeLockError}
		onFix={() => practice.handleUserInteraction()}
	/>

	<PracticeHeader
		routineName={data.practice.routine.name}
		totalSets={practice.totalSets}
		completedSets={practice.completedSetsCount}
		duration={practice.duration}
		currentMovementIndex={practice.activeMovementIndex}
		totalMovements={data.allRoutineMovements.length}
		isPreview={false}
		onExit={() => practice.exit()}
		onSettings={() => (showSettings = true)}
	/>

	<main class="pt-4 pb-32 px-4 max-w-4xl mx-auto">
		{#if practice.hasStarted && practice.settings.autoPlay && data.practice.routine.restBetweenMovements > 0}
			{@const isRestActive = practice.showRestTimer && practice.restType === 'between-movements' && practice.restingMovementIndex === -1}
			<InlineRestTimer
				remainingTime={isRestActive ? practice.restTimerValue : data.practice.routine.restBetweenMovements}
				totalDuration={data.practice.routine.restBetweenMovements}
				type="between-movements"
				nextExerciseName={data.allRoutineMovements[0]?.movement.name}
				onSkip={isRestActive ? () => practice.skipRest() : undefined}
				isActive={isRestActive}
				isCompleted={firstMovementCompleted}
				isPaused={practice.isPaused}
			/>
		{/if}

		{#if data.allRoutineMovements.length === 0}
			<div class="text-center py-12">
				<p class="text-text-secondary font-body">No movements in this routine</p>
			</div>
		{:else if practice.isReadOnly}
			<div class="mb-6 p-4 bg-warning/10 border border-warning">
				<p class="text-warning font-body">
					<strong class="font-title font-bold">Read-only mode:</strong> This practice has already been completed and cannot be modified.
				</p>
			</div>
		{/if}

		{#each data.allRoutineMovements as rm, index (rm.id)}
			{@const isActive = practice.isMovementActive(index)}
			{@const movementPreviousStats = data.previousStatsMap[rm.id] || null}

			<div id="movement-{rm.id}">
				<MovementBlock
					movement={{
						id: rm.id,
						movement: rm.movement,
						target: rm.target,
						sets: rm.sets,
						isBilateral: rm.isBilateral,
						switchSidesDuration: rm.switchSidesDuration || 5,
						weight: rm.weight,
						weightUnit: rm.weightUnit,
						notes: rm.notes
					}}
					index={index}
					{isActive}
					onMoveUp={() => practice.reorderMovement(rm.id, 'up')}
					onMoveDown={() => practice.reorderMovement(rm.id, 'down')}
					onRemove={() => practice.removeMovement(rm.id)}
					isFirst={index === 0}
					isLast={index === data.allRoutineMovements.length - 1}
				/>
			</div>

			{#if index < data.allRoutineMovements.length - 1}
				{@const isRestActive = practice.showRestTimer && practice.restType === 'between-movements' && practice.restingMovementIndex === index}
				{@const currentMovementSets = rm.isBilateral ? (practice.setOverrides[rm.id] ?? rm.sets) * 2 : (practice.setOverrides[rm.id] ?? rm.sets)}
				{@const isCurrentMovementComplete = countCompletedMovementSets(rm.id, practice.completedSets, practice.skippedSets) >= currentMovementSets}
				{@const nextMovement = data.allRoutineMovements[index + 1]}
				{@const isNextMovementStarted = countCompletedMovementSets(nextMovement.id, practice.completedSets, practice.skippedSets) > 0}

				<InlineRestTimer
					remainingTime={isRestActive ? practice.restTimerValue : data.practice.routine.restBetweenMovements}
					totalDuration={data.practice.routine.restBetweenMovements}
					type="between-movements"
					nextExerciseName={nextMovement.movement.name}
					onSkip={isRestActive ? () => practice.skipRest() : undefined}
					isActive={isRestActive}
					isCompleted={isNextMovementStarted}
					isPaused={practice.isPaused}
				/>
			{/if}
		{/each}

		{#if !practice.isReadOnly}
			<button
				onclick={() => (showAddMovementModal = true)}
				disabled={practice.isPaused}
				class="w-full p-4 bg-surface-elevated border-2 border-dashed border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated disabled:hover:text-text-secondary disabled:hover:border-accent-track transition-colors flex items-center justify-center gap-2 font-body"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add Movement
			</button>
		{/if}
	</main>

	{#if !practice.isReadOnly}
		<PracticeFooter
			completedSets={practice.completedSetsCount}
			totalSets={practice.totalSets}
			onCompleteWorkout={() => practice.completeWorkout()}
			isCompletingWorkout={practice.isCompletingWorkout}
			onTogglePause={() => practice.togglePause()}
			isPaused={practice.isPaused}
		/>
	{/if}

	<PracticePauseBanner
		show={practice.isPaused}
		onResume={() => practice.togglePause()}
	/>

	<PracticeSettings
		show={showSettings}
		settings={practice.settings}
		onSave={(newSettings) => {
			practice.saveSettings(newSettings);
			showSettings = false;
		}}
		onCancel={() => (showSettings = false)}
		isSaving={practice.isSavingSettings}
		error={practice.settingsError}
	/>

	<AddMovementModal
		isOpen={showAddMovementModal}
		isLoading={practice.isAddingMovement}
		isPaused={practice.isPaused}
		groupedMovements={data.groupedMovements}
		onAdd={(movementId) => {
			practice.addMovement(movementId);
			showAddMovementModal = false;
		}}
		onClose={() => (showAddMovementModal = false)}
	/>
</div>

<style>
	:global(body) {
		background: var(--color-base);
	}
</style>
