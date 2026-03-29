<script lang="ts">
	import { ArrowLeft, ArrowUp, ArrowDown, X, Plus, Barbell } from 'phosphor-svelte';

	interface Movement {
		id: string;
		name: string;
		type: string;
		metadata?: {
			defaultTarget?: {
				value?: number;
				unit?: string;
			};
		} | null;
		weightUnit?: string | null;
		isBilateral?: boolean;
		switchSidesDuration?: number;
		description?: string | null;
		isCustom?: boolean;
		[key: string]: any; // Allow additional properties from database
	}

	interface SelectedMovement {
		movementId: string;
		name: string;
		type: string;
		targetType: 'time' | 'reps';
		targetValue: number;
		targetUnit?: string | null;
		weight?: number | null;
		weightUnit?: string | null;
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
		notes: string;
	}

	interface RoutineData {
		id?: string;
		name: string;
		description?: string | null;
		restBetweenMovements?: number | null;
		restBetweenSets?: number | null;
		autoAdvance?: boolean | null;
		audioEnabled?: boolean | null;
		keepAwake?: boolean | null;
		movements?: {
			movementId: string;
			movement: Movement;
			target: {
				type: 'time' | 'reps';
				value: number;
				unit?: string | null;
			};
			sets: number;
			isBilateral?: boolean;
			switchSidesDuration?: number;
			weight?: number | null;
			weightUnit?: string | null;
			notes?: string | null;
		}[];
		[key: string]: any; // Allow additional properties from database
	}

	interface Props {
		mode: 'create' | 'edit';
		initialData?: RoutineData | null;
		availableMovements: Movement[];
		formError?: string | null;
		formMissingFields?: string[] | null;
		formInvalidValues?: boolean;
		formDuplicateName?: string | null;
		formUnauthorized?: boolean;
		formNoMovements?: boolean;
		backUrl: string;
		backText: string;
	}

	let {
		mode,
		initialData = null,
		availableMovements,
		formError,
		formMissingFields,
		formInvalidValues,
		formDuplicateName,
		formUnauthorized,
		formNoMovements,
		backUrl,
		backText
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let name = $state(initialData?.name ?? '');
	// svelte-ignore state_referenced_locally
	let description = $state(initialData?.description ?? '');
	// svelte-ignore state_referenced_locally
	let restBetweenMovements = $state(String(initialData?.restBetweenMovements ?? '30'));
	// svelte-ignore state_referenced_locally
	let restBetweenSets = $state(String(initialData?.restBetweenSets ?? '15'));
	// svelte-ignore state_referenced_locally
	let autoAdvance = $state(initialData?.autoAdvance ?? true);
	// svelte-ignore state_referenced_locally
	let audioEnabled = $state(initialData?.audioEnabled ?? true);
	// svelte-ignore state_referenced_locally
	let keepAwake = $state(initialData?.keepAwake ?? true);

	// svelte-ignore state_referenced_locally
	let selectedMovements = $state<SelectedMovement[]>(
		initialData?.movements?.map((rm) => ({
			movementId: rm.movementId,
			name: rm.movement.name,
			type: rm.movement.type,
			targetType: rm.target.type,
			targetValue: rm.target.value,
			targetUnit: rm.target.unit,
			weight: rm.weight,
			weightUnit: rm.weightUnit,
			sets: rm.sets || 1,
			isBilateral: rm.isBilateral ?? false,
			switchSidesDuration: rm.switchSidesDuration ?? 5,
			notes: rm.notes || ''
		})) ?? []
	);

	const groupedMovements = $derived.by(() => {
		const groups: Record<string, Movement[]> = {
			Timed: [],
			Repetitions: [],
			Weighted: [],
			'Resistance Band': []
		};

		for (const movement of availableMovements) {
			if (movement.type === 'timed') groups.Timed.push(movement);
			else if (movement.type === 'reps') groups.Repetitions.push(movement);
			else if (movement.type === 'weighted') groups.Weighted.push(movement);
			else if (movement.type === 'resistance_band') groups['Resistance Band'].push(movement);
		}

		return groups;
	});

	const movementsData = $derived(
		JSON.stringify(
			selectedMovements.map((m) => ({
				movementId: m.movementId,
				targetType: m.targetType,
				targetValue: m.targetValue,
				targetUnit: m.targetUnit,
				weight: m.weight,
				weightUnit: m.weightUnit,
				sets: m.sets,
				isBilateral: m.isBilateral,
				switchSidesDuration: m.switchSidesDuration,
				notes: m.notes
			}))
		)
	);

	function addMovement(movementId: string) {
		const movement = availableMovements.find((m) => m.id === movementId);
		if (!movement) return;

		const targetTypeMap = {
			timed: 'time' as const,
			reps: 'reps' as const,
			weighted: 'reps' as const,
			resistance_band: 'reps' as const
		};

		const defaultTarget = movement.metadata?.defaultTarget;

		selectedMovements = [
			...selectedMovements,
			{
				movementId: movement.id,
				name: movement.name,
				type: movement.type,
				targetType: targetTypeMap[movement.type as keyof typeof targetTypeMap],
				targetValue: defaultTarget?.value || 30,
				targetUnit: defaultTarget?.unit,
				weight: undefined,
				weightUnit: movement.weightUnit || undefined,
				sets: 1,
				isBilateral: movement.isBilateral ?? false,
				switchSidesDuration: movement.switchSidesDuration ?? 5,
				notes: ''
			}
		];
	}

	function removeMovement(index: number) {
		selectedMovements = selectedMovements.filter((_, i) => i !== index);
	}

	function moveMovement(index: number, direction: 'up' | 'down') {
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= selectedMovements.length) return;

		const newMovements = [...selectedMovements];
		[newMovements[index], newMovements[newIndex]] = [newMovements[newIndex], newMovements[index]];
		selectedMovements = newMovements;
	}

	function updateMovement(index: number, field: keyof SelectedMovement, value: any) {
		selectedMovements = selectedMovements.map((m, i) =>
			i === index ? { ...m, [field]: value } : m
		);
	}
</script>

<div class="min-h-screen bg-base">
	<header class="sticky top-0 z-10 bg-surface border-b-2 border-accent-track">
		<div class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
			<div class="flex items-center gap-4">
				<a
					href={backUrl}
					class="inline-flex items-center gap-2 text-text-muted hover:text-accent-primary transition-colors text-sm font-body uppercase tracking-wider"
				>
					<ArrowLeft weight="bold" size={16} />
					{backText}
				</a>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8 pb-32">
		<!-- Title Section -->
		<section class="mb-8 pb-6 border-b-2 border-accent-track">
			<div class="space-y-2">
				<div class="flex items-baseline gap-4">
					<span class="text-text-muted text-sm uppercase tracking-widest font-body">ROUTINE</span>
					<div class="flex-1 h-px bg-accent-track"></div>
				</div>
				<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
					{mode === 'create' ? 'CREATE' : 'EDIT'}
				</h1>
			</div>
		</section>

		<form method="POST" id="routine-form" class="space-y-8">
			<!-- Error Messages -->
			{#if formError}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					{formError}
				</div>
			{/if}

			{#if formUnauthorized}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					You must be logged in to {mode} a routine
				</div>
			{/if}

			{#if formMissingFields && formMissingFields.length > 0}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					<strong>Missing required fields:</strong> {formMissingFields.join(', ')}
				</div>
			{/if}

			{#if formInvalidValues}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					Rest times must be positive numbers
				</div>
			{/if}

			{#if formDuplicateName}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					A routine with the name "{formDuplicateName}" already exists
				</div>
			{/if}

			{#if formNoMovements}
				<div class="p-4 bg-error/10 border-2 border-error text-error">
					Please add at least one movement to your routine
				</div>
			{/if}

			<!-- Basic Information Section -->
			<section class="border-b-2 border-accent-track pb-8">
				<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">
						BASIC INFO
					</h2>
				</div>

				<div
					class="bg-surface border-t-4 border-t-accent-primary p-6"
					style="box-shadow: var(--shadow-elevated);"
				>
					<div class="space-y-6">
						<div class="space-y-2">
							<label for="name" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
								Routine Name <span class="text-error">*</span>
							</label>
							<input
								id="name"
								name="name"
								type="text"
								bind:value={name}
								class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
								placeholder="Morning Stretch"
								required
							/>
						</div>

						<div class="space-y-2">
							<label for="description" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
								Description
							</label>
							<textarea
								id="description"
								name="description"
								bind:value={description}
								rows="3"
								class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors resize-none"
								placeholder="A quick morning routine to start your day..."
							></textarea>
						</div>
					</div>
				</div>
			</section>

			<!-- Settings Section -->
			<section class="border-b-2 border-accent-track pb-8">
				<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">
						SETTINGS
					</h2>
				</div>

				<div
					class="bg-surface border-t-4 border-t-accent-primary p-6"
					style="box-shadow: var(--shadow-elevated);"
				>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div class="space-y-2">
							<label for="rest_between_movements" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
								Rest Between Movements (seconds)
							</label>
							<input
								id="rest_between_movements"
								name="rest_between_movements"
								type="number"
								bind:value={restBetweenMovements}
								min="0"
								class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
								required
							/>
						</div>

						<div class="space-y-2">
							<label for="rest_between_sets" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
								Rest Between Sets (seconds)
							</label>
							<input
								id="rest_between_sets"
								name="rest_between_sets"
								type="number"
								bind:value={restBetweenSets}
								min="0"
								class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
								required
							/>
						</div>
					</div>

					<div class="space-y-4 border-t-2 border-accent-track pt-6">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="auto_advance"
								bind:checked={autoAdvance}
								value="true"
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:ring-accent-primary"
							/>
							<span class="text-text-primary">Auto-advance to next movement</span>
						</label>

						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="audio_enabled"
								bind:checked={audioEnabled}
								value="true"
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:ring-accent-primary"
							/>
							<span class="text-text-primary">Enable audio cues</span>
						</label>

						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="keep_awake"
								bind:checked={keepAwake}
								value="true"
								class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:ring-accent-primary"
							/>
							<span class="text-text-primary">Keep screen awake during practice</span>
						</label>
					</div>
				</div>
			</section>

			<!-- Movements Section -->
			<section class="border-b-2 border-accent-track pb-8">
				<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">
						MOVEMENTS ({selectedMovements.length})
					</h2>
				</div>

				{#if selectedMovements.length === 0}
					<div class="bg-surface p-8 text-center border-t-4 border-t-accent-warm" style="box-shadow: var(--shadow-elevated);">
						<p class="text-text-secondary">No movements added yet. Select movements below to get started.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each selectedMovements as movement, index (index)}
							<div
								class="bg-surface border-t-4 border-t-accent-primary p-4 sm:p-6"
								style="box-shadow: var(--shadow-elevated);"
							>
								<div class="flex items-start justify-between gap-4 mb-4">
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 bg-surface-elevated flex items-center justify-center shrink-0">
											<span class="font-mono text-sm text-accent-primary">{String(index + 1).padStart(2, '0')}</span>
										</div>
										<h3 class="font-title text-lg text-text-primary">{movement.name}</h3>
									</div>
									<div class="flex items-center gap-1 shrink-0">
										<button
											type="button"
											onclick={() => moveMovement(index, 'up')}
											disabled={index === 0}
											class="w-8 h-8 flex items-center justify-center bg-surface-elevated hover:bg-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
										>
											<ArrowUp weight="bold" size={16} class="text-text-primary" />
										</button>
										<button
											type="button"
											onclick={() => moveMovement(index, 'down')}
											disabled={index === selectedMovements.length - 1}
											class="w-8 h-8 flex items-center justify-center bg-surface-elevated hover:bg-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
										>
											<ArrowDown weight="bold" size={16} class="text-text-primary" />
										</button>
										<button
											type="button"
											onclick={() => removeMovement(index)}
											class="w-8 h-8 flex items-center justify-center bg-error/20 hover:bg-error text-error transition-colors"
										>
											<X weight="bold" size={16} />
										</button>
									</div>
								</div>

								<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 ml-0 sm:ml-13">
									<div class="space-y-1">
										<label for="target_type_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Target Type</label>
										<select
											id="target_type_{index}"
											value={movement.targetType}
											onchange={(e) => updateMovement(index, 'targetType', e.currentTarget.value)}
											class="w-full px-3 py-2 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
										>
											<option value="time">Time</option>
											<option value="reps">Repetitions</option>
										</select>
									</div>

									<div class="space-y-1">
										<label for="target_value_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Target Value</label>
										<input
											type="number"
											min="1"
											id="target_value_{index}"
											value={movement.targetValue}
											oninput={(e) => updateMovement(index, 'targetValue', parseInt(e.currentTarget.value))}
											class="w-full px-3 py-2 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
										/>
									</div>

									<div class="space-y-1">
										<label for="target_unit_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Unit</label>
										<input
											type="text"
											id="target_unit_{index}"
											value={movement.targetUnit}
											oninput={(e) => updateMovement(index, 'targetUnit', e.currentTarget.value)}
											class="w-full px-3 py-2 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
											placeholder="seconds"
										/>
									</div>
								</div>

								{#if movement.type === 'weighted' || movement.type === 'resistance_band'}
									<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ml-0 sm:ml-13">
										<div class="space-y-1">
											<label for="weight_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Default Weight</label>
											<input
												type="number"
												min="0"
												id="weight_{index}"
												value={movement.weight}
												oninput={(e) => updateMovement(index, 'weight', parseFloat(e.currentTarget.value))}
												class="w-full px-3 py-2 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
												placeholder="0"
											/>
										</div>

										<div class="space-y-1">
											<label for="weight_unit_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Weight Unit</label>
											<select
												id="weight_unit_{index}"
												value={movement.weightUnit}
												onchange={(e) => updateMovement(index, 'weightUnit', e.currentTarget.value)}
												class="w-full px-3 py-2 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
											>
												<option value="">Select unit</option>
												<option value="lbs">lbs</option>
												<option value="kg">kg</option>
												<option value="bodyweight">Bodyweight</option>
											</select>
										</div>
									</div>
								{/if}

								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ml-0 sm:ml-13">
									<div class="space-y-1">
										<label for="sets_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Sets</label>
										<input
											type="number"
											min="1"
											id="sets_{index}"
											value={movement.sets}
											oninput={(e) => updateMovement(index, 'sets', parseInt(e.currentTarget.value))}
											class="w-full px-3 py-2 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
										/>
									</div>

									<div class="space-y-1">
										<label for="notes_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Notes</label>
										<input
											type="text"
											id="notes_{index}"
											value={movement.notes}
											oninput={(e) => updateMovement(index, 'notes', e.currentTarget.value)}
											class="w-full px-3 py-2 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
											placeholder="Focus on form..."
										/>
									</div>
								</div>

								<div class="ml-0 sm:ml-13 space-y-3 border-t-2 border-accent-track pt-4">
									<label class="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={movement.isBilateral}
											onchange={(e) => updateMovement(index, 'isBilateral', e.currentTarget.checked)}
											class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:ring-accent-primary"
										/>
										<span class="text-text-primary text-sm">Bilateral exercise (left/right sides)</span>
									</label>

									{#if movement.isBilateral}
										<div class="space-y-1">
											<label for="switch_duration_{index}" class="block text-xs font-title uppercase tracking-wider text-text-muted">Switch Sides Duration (seconds)</label>
											<input
												type="number"
												min="0"
												id="switch_duration_{index}"
												value={movement.switchSidesDuration}
												oninput={(e) => updateMovement(index, 'switchSidesDuration', parseInt(e.currentTarget.value))}
												class="w-full px-3 py-2 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors text-sm"
											/>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Add Movements Section -->
			<section>
				<div class="flex items-center justify-between mb-6 pb-4 border-b border-accent-track">
					<h2 class="font-display text-3xl text-text-primary tracking-wider">
						ADD MOVEMENTS
					</h2>
				</div>

				{#each Object.entries(groupedMovements) as [category, movementsList]}
					{#if movementsList.length > 0}
						<div class="mb-8">
							<h3 class="font-title text-lg text-text-secondary mb-4 uppercase tracking-wider">{category}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
								{#each movementsList as movement}
									<button
										type="button"
										onclick={() => addMovement(movement.id)}
										class="group bg-surface hover:bg-surface-elevated transition-colors text-left p-4 border-2 border-accent-track hover:border-accent-primary"
										style="box-shadow: var(--shadow-elevated);"
									>
										<div class="flex items-start justify-between gap-2">
											<h4 class="font-title text-text-primary group-hover:text-accent-primary transition-colors text-sm">
												{movement.name}
											</h4>
											<div class="w-6 h-6 flex items-center justify-center bg-accent-primary/10 group-hover:bg-accent-primary transition-colors shrink-0">
												<Plus weight="bold" size={14} class="text-accent-primary group-hover:text-white transition-colors" />
											</div>
										</div>
										{#if movement.description}
											<p class="text-text-muted text-xs mt-2 line-clamp-2">{movement.description}</p>
										{/if}
										{#if movement.isCustom}
											<span class="inline-block mt-2 text-xs px-2 py-0.5 bg-accent-warm/20 text-accent-warm font-mono">Yours</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</section>

			<input type="hidden" name="movements_data" value={movementsData} />
		</form>
	</main>

	<!-- Fixed Bottom Button -->
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t-2 border-accent-track" style="box-shadow: var(--shadow-floating);">
		<div class="max-w-4xl mx-auto">
			<button
				type="submit"
				form="routine-form"
				disabled={selectedMovements.length === 0}
				class="w-full bg-accent-primary hover:bg-accent-primary-light disabled:bg-surface-elevated text-white py-4 px-6 transition-colors font-display text-lg tracking-widest uppercase disabled:cursor-not-allowed"
			>
				{mode === 'create' ? 'Create Routine' : 'Save Changes'}
			</button>
		</div>
	</div>
</div>
