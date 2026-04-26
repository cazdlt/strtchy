<script lang="ts">
	import { onDestroy, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { PracticeSession } from '$lib/composables/PracticeSession.svelte';
	import { formatTime } from '$lib/utils/formatting';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { routineMovements, movements, practiceData } from '$lib/db/schema';

	// Components
	import PracticeHeader from '../../../components/practice/PracticeHeader.svelte';
	import InlineRestTimer from '../../../components/practice/InlineRestTimer.svelte';
	import MovementBlock from '../../../components/practice/MovementBlock.svelte';
	import PracticeFooter from '../../../components/practice/PracticeFooter.svelte';
	import PracticeSettingsModal from '../../../components/practice/PracticeSettings.svelte';
	import PracticePauseBanner from '../../../components/practice/PracticePauseBanner.svelte';
	import StartPracticeOverlay from '../../../components/practice/StartPracticeOverlay.svelte';
	import AddMovementModal from '../../../components/practice/AddMovementModal.svelte';

	let { data } = $props<{ data: PageData }>();

	// Snapshot page data to avoid reactive warnings during initialization
	// svelte-ignore state_referenced_locally
	const initialData = $state.snapshot(data);

	// ── Build MovementSnapshots from server data ──
	function buildSnapshots() {
		return initialData.allRoutineMovements.map((rm: InferSelectModel<typeof routineMovements> & { movement: InferSelectModel<typeof movements> }) => ({
			id: rm.id,
			movementId: rm.movementId,
			name: rm.movement.name,
			type: rm.movement.type as 'timed' | 'reps' | 'weighted' | 'resistance_band',
			target: rm.target,
			sets: rm.sets,
			isBilateral: rm.isBilateral,
			switchSidesDuration: rm.switchSidesDuration || 5,
			weight: rm.weight,
			weightUnit: rm.weightUnit,
			notes: rm.notes,
			order: rm.order,
		}));
	}

	// ── Initialize PracticeSession ──
	const session = new PracticeSession();
	setContext('practice', session);

	// Load routine data
	session.loadFromRoutine(
		initialData.practice.id,
		initialData.practice.routineId,
		buildSnapshots(),
		{
			restBetweenSets: initialData.practice.routine.restBetweenSets,
			restBetweenMovements: initialData.practice.routine.restBetweenMovements,
		},
		{
			autoPlay: initialData.practice.routine.autoAdvance ?? initialData.userPrefs?.autoAdvance ?? false,
			audioEnabled: initialData.practice.routine.audioEnabled ?? initialData.userPrefs?.audioEnabled ?? true,
			keepAwake: initialData.practice.routine.keepAwake ?? initialData.userPrefs?.keepAwake ?? true,
		}
	);

	// Hydrate from existing server data or localStorage
	if (initialData.existingPracticeData.length > 0) {
		session.hydrateFromServer(initialData.existingPracticeData.map((pd: InferSelectModel<typeof practiceData>) => ({
			movementId: pd.movementId,
			setNumber: pd.setNumber,
			side: pd.side as 'left' | 'right' | null,
			value: pd.value,
			weight: pd.weight,
			weightUnit: pd.weightUnit,
			rating: pd.rating,
			status: pd.status,
			completedAt: pd.completedAt,
		})));
	} else {
		// Try restore from localStorage
		const saved = PracticeSession.tryRestoreFromStorage(initialData.practice.id);
		if (saved) {
			session.fromJSON(saved);
		}
	}

	// ── Local UI state ──
	let showSettings = $state(false);
	let showAddMovementModal = $state(false);
	let isCompleting = $state(false);
	let isSavingSettings = $state(false);
	let settingsError = $state<string | null>(null);
	let isAddingMovement = $state(false);
	let isRemovingMovement = $state(false);
	let isReordering = $state(false);
	let isAdjustingSets = $state(false);

	// ── Auto-save to localStorage ──
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// React to any state change
		const _deps = {
			completed: session.completedSets.size,
			skipped: session.skippedSets.size,
			hasStarted: session.hasStarted,
			timer: session.timer.durationSeconds,
			movements: session.movements.length,
		};
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			session.saveToStorage();
		}, 3000);
	});

	// ── Start practice ──
	function handleStartPractice() {
		if (!session.hasStarted) {
			session.start();
		}
	}

	// Auto-start if already has data
	$effect(() => {
		if (data.existingPracticeData.length > 0 && !session.hasStarted) {
			handleStartPractice();
		}
	});

	// ── Complete workout ──
	async function handleCompleteWorkout() {
		if (!confirm('Complete workout?')) return;
		isCompleting = true;
		const serverData = session.completeWorkout();

		const formData = new FormData();
		formData.append('duration', String(serverData.duration));
		formData.append('practiceData', JSON.stringify(serverData.practiceData));

		const response = await fetch('?/completePractice', {
			method: 'POST',
			body: formData,
		});

		if (response.ok) {
			session.clearStorage();
			goto(`/practice/${data.practice.id}/summary`);
		} else {
			isCompleting = false;
			alert('Failed to complete workout. Please try again.');
		}
	}

	// ── Settings ──
	async function saveSettings(newSettings: { autoPlay: boolean; audioEnabled: boolean; keepAwake: boolean }) {
		isSavingSettings = true;
		settingsError = null;

		const formData = new FormData();
		formData.append('autoPlay', String(newSettings.autoPlay));
		formData.append('audioEnabled', String(newSettings.audioEnabled));
		formData.append('keepAwake', String(newSettings.keepAwake));
		formData.append('practiceId', data.practice.id);

		try {
			const response = await fetch('?/updatePracticeSettings', {
				method: 'POST',
				body: formData,
			});
			if (response.ok) {
				session.settings = newSettings;
				showSettings = false;
			} else {
				settingsError = 'Failed to save settings';
			}
		} catch {
			settingsError = 'Failed to save settings';
		} finally {
			isSavingSettings = false;
		}
	}

	// ── Structural changes with server sync ──
	async function handleAddMovement(movementId: string) {
		isAddingMovement = true;
		const formData = new FormData();
		formData.append('movementId', movementId);

		const response = await fetch('?/addMovement', {
			method: 'POST',
			body: formData,
		});

		if (response.ok) {
			// Reload page data to get the new movement
			// In a real app we'd parse the response, but for simplicity we just invalidate
			window.location.reload();
		} else {
			alert('Failed to add movement');
			isAddingMovement = false;
		}
	}

	async function handleRemoveMovement(routineMovementId: string) {
		if (!confirm('Remove this movement from the routine?')) return;
		isRemovingMovement = true;
		// Update local state first
		session.removeMovement(routineMovementId);

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);

		const response = await fetch('?/removeMovement', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			alert('Failed to remove movement');
		}
		isRemovingMovement = false;
	}

	async function handleReorderMovement(routineMovementId: string, direction: 'up' | 'down') {
		isReordering = true;
		session.reorderMovement(routineMovementId, direction);

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('direction', direction);

		const response = await fetch('?/reorderMovement', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			alert('Failed to reorder movement');
			// Revert? For now just reload
			window.location.reload();
		}
		isReordering = false;
	}

	async function handleAdjustSets(routineMovementId: string, direction: 'up' | 'down') {
		isAdjustingSets = true;
		session.adjustSets(routineMovementId, direction === 'up' ? 1 : -1);

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('direction', direction);

		const response = await fetch('?/adjustSets', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			alert(errorData.error || 'Failed to adjust sets');
		}
		isAdjustingSets = false;
	}

	async function handleUpdateNotes(routineMovementId: string, notes: string) {
		session.updateNotes(routineMovementId, notes);

		const formData = new FormData();
		formData.append('routineMovementId', routineMovementId);
		formData.append('notes', notes);

		await fetch('?/updateMovementNotes', {
			method: 'POST',
			body: formData,
		});
	}

	// ── Cleanup ──
	onDestroy(() => {
		session.timer.cleanup();
		if (saveTimeout) clearTimeout(saveTimeout);
	});

	// ── Derived for UI ──
	let totalSets = $derived(session.totalSets);
	let completedSetsCount = $derived(session.completedCount);
	let progress = $derived(session.progress);
	let currentMovementIndex = $derived(session.currentMovementIndex);
	let isPaused = $derived(session.timer.isPaused);
	let isReadOnly = $derived(data.isReadOnly);

	// Check if first movement has any completed sets (for initial rest display)
	let firstMovementCompleted = $derived(
		data.allRoutineMovements.length > 0
			? session.isSetCompleted(data.allRoutineMovements[0].id, 1, data.allRoutineMovements[0].isBilateral ? 'left' : null)
			: false
	);
</script>

<svelte:head>
	<title>Practice - Strtchy</title>
</svelte:head>

<div class="min-h-screen bg-base text-text-primary">
	{#if !session.hasStarted && !isReadOnly}
		<StartPracticeOverlay
			routineName={data.practice.routine.name}
			totalSets={totalSets}
			settings={session.settings}
			equipment={data.equipment}
			onStart={handleStartPractice}
		/>
	{/if}

	<PracticeHeader
		routineName={data.practice.routine.name}
		totalSets={totalSets}
		completedSets={completedSetsCount}
		duration={session.timer.durationSeconds}
		currentMovementIndex={currentMovementIndex}
		totalMovements={data.allRoutineMovements.length}
		isPreview={false}
		onExit={() => {
			if (confirm('Exit practice? Your progress so far is saved.')) {
				session.timer.cleanup();
				goto(isReadOnly ? `/routine/${data.practice.routineId}` : '/');
			}
		}}
		onSettings={() => (showSettings = true)}
	/>

	<PracticePauseBanner
		show={isPaused}
		onResume={() => session.togglePause()}
	/>

	<main class="pt-4 pb-32 px-4 max-w-4xl mx-auto">
		{#if session.hasStarted && session.settings.autoPlay}
			{@const restInfo = session.timer.restInfo}
			{@const isRestActive = session.timer.state === 'rest' && (restInfo?.type === 'get-ready' || restInfo?.type === 'between-movements')}
			{@const currentDuration = restInfo?.type === 'get-ready' ? 15 : data.practice.routine.restBetweenMovements}
			<InlineRestTimer
				remainingTime={isRestActive ? (restInfo?.remaining ?? currentDuration) : currentDuration}
				totalDuration={currentDuration}
				type={isRestActive && restInfo?.type === 'get-ready' ? 'get-ready' : 'between-movements'}
				nextExerciseName={restInfo?.nextMovementName || data.allRoutineMovements[session.currentMovementIndex + 1]?.movement.name || data.allRoutineMovements[0]?.movement.name}
				onSkip={isRestActive ? () => session.skipRest() : undefined}
				isActive={isRestActive}
				isCompleted={firstMovementCompleted}
				isPaused={isPaused}
			/>
		{/if}

		{#if data.allRoutineMovements.length === 0}
			<div class="text-center py-12">
				<p class="text-text-secondary font-body">No movements in this routine</p>
			</div>
		{:else if isReadOnly}
			<div class="mb-6 p-4 bg-warning/10 border border-warning">
				<p class="text-warning font-body">
					<strong class="font-title font-bold">Read-only mode:</strong> This practice has already been completed and cannot be modified.
				</p>
			</div>
		{/if}

		{#each data.allRoutineMovements as rm, index (rm.id)}
			{@const isActive = index === currentMovementIndex && !isReadOnly && session.hasStarted}

			<div id="movement-{rm.id}">
				<MovementBlock
					movement={{
						id: rm.id,
						movementId: rm.movementId,
						name: rm.movement.name,
						type: rm.movement.type,
						target: rm.target,
						sets: rm.sets,
						isBilateral: rm.isBilateral,
						switchSidesDuration: rm.switchSidesDuration || 5,
						weight: rm.weight,
						weightUnit: rm.weightUnit,
						notes: rm.notes,
						order: rm.order,
					}}
					{isActive}
					onMoveUp={() => handleReorderMovement(rm.id, 'up')}
					onMoveDown={() => handleReorderMovement(rm.id, 'down')}
					onRemove={() => handleRemoveMovement(rm.id)}
					onAdjustSets={(delta) => handleAdjustSets(rm.id, delta === 1 ? 'up' : 'down')}
					onNotesChange={(notes) => handleUpdateNotes(rm.id, notes)}
					isFirst={index === 0}
					isLast={index === data.allRoutineMovements.length - 1}
				/>
			</div>

			{#if index < data.allRoutineMovements.length - 1}
				{@const isRestActive = session.timer.state === 'rest' && session.timer.restInfo?.type === 'between-movements' && session.currentMovementIndex === index}
				{@const nextMovement = data.allRoutineMovements[index + 1]}
				{@const isNextMovementStarted = session.isSetCompleted(nextMovement.id, 1, nextMovement.isBilateral ? 'left' : null)}

				<InlineRestTimer
					remainingTime={isRestActive ? (session.timer.restInfo?.remaining ?? data.practice.routine.restBetweenMovements) : data.practice.routine.restBetweenMovements}
					totalDuration={data.practice.routine.restBetweenMovements}
					type="between-movements"
					nextExerciseName={nextMovement.movement.name}
					onSkip={isRestActive ? () => session.skipRest() : undefined}
					isActive={isRestActive}
					isCompleted={isNextMovementStarted}
					isPaused={isPaused}
				/>
			{/if}
		{/each}

		{#if !isReadOnly}
			<button
				onclick={() => (showAddMovementModal = true)}
				disabled={isPaused}
				class="w-full p-4 bg-surface-elevated border-2 border-dashed border-accent-track text-text-secondary hover:text-text-primary hover:border-accent-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-surface-elevated disabled:hover:text-text-secondary disabled:hover:border-accent-track transition-colors flex items-center justify-center gap-2 font-body"
			>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add Movement
			</button>
		{/if}
	</main>

	{#if !isReadOnly && session.hasStarted}
		<PracticeFooter
			completedSets={completedSetsCount}
			totalSets={totalSets}
			onCompleteWorkout={handleCompleteWorkout}
			isCompletingWorkout={isCompleting}
			onTogglePause={() => session.togglePause()}
			isPaused={isPaused}
		/>
	{/if}

	<PracticeSettingsModal
		show={showSettings}
		settings={session.settings}
		onSave={saveSettings}
		onCancel={() => (showSettings = false)}
		isSaving={isSavingSettings}
		error={settingsError}
	/>

	<AddMovementModal
		isOpen={showAddMovementModal}
		isLoading={isAddingMovement}
		isPaused={isPaused}
		groupedMovements={data.groupedMovements}
		onAdd={(movementId) => {
			handleAddMovement(movementId);
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
