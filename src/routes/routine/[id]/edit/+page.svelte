<script lang="ts">
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();

	let name = $state(data.routine.name);
	let description = $state(data.routine.description || '');
	let restBetweenMovements = $state(String(data.routine.restBetweenMovements || '30'));
	let restBetweenSets = $state(String(data.routine.restBetweenSets || '15'));
	let autoAdvance = $state(data.routine.autoAdvance ?? true);
	let audioEnabled = $state(data.routine.audioEnabled ?? true);
	let keepAwake = $state(data.routine.keepAwake ?? true);

	interface SelectedMovement {
		movementId: string;
		name: string;
		type: string;
		targetType: 'time' | 'reps' | 'distance';
		targetValue: number;
		targetUnit?: string;
		sets: number;
		isBilateral: boolean;
		switchSidesDuration: number;
		notes: string;
	}

	let selectedMovements = $state<SelectedMovement[]>(
		data.routine.movements.map((rm) => ({
			movementId: rm.movementId,
			name: rm.movement.name,
			type: rm.movement.type,
			targetType: rm.target.type,
			targetValue: rm.target.value,
			targetUnit: rm.target.unit,
			sets: rm.sets || 1,
			isBilateral: rm.isBilateral ?? false,
			switchSidesDuration: rm.switchSidesDuration ?? 5,
			notes: rm.notes || ''
		}))
	);

	$effect(() => {
		if (form?.missingFields) {
			console.log('Missing fields:', form.missingFields);
		}
	});

	function addMovement(movementId: string) {
		const movement = data.movements.find((m: any) => m.id === movementId);
		if (!movement) return;

		const targetTypeMap = {
			timed: 'time' as const,
			reps: 'reps' as const,
			count: 'reps' as const,
			distance: 'distance' as const
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
				sets: 1,
				isBilateral: false,
				switchSidesDuration: 5,
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
		selectedMovements = selectedMovements.map((m: SelectedMovement, i: number) =>
			i === index ? { ...m, [field]: value } : m
		);
	}

	const groupedMovements = $derived.by(() => {
		const groups: Record<string, any[]> = {
			Timed: [],
			Repetitions: [],
			Count: [],
			Distance: []
		};

		for (const movement of data.movements) {
			if (movement.type === 'timed') groups.Timed.push(movement);
			else if (movement.type === 'reps') groups.Repetitions.push(movement);
			else if (movement.type === 'count') groups.Count.push(movement);
			else if (movement.type === 'distance') groups.Distance.push(movement);
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
				sets: m.sets,
				isBilateral: m.isBilateral,
				switchSidesDuration: m.switchSidesDuration,
				notes: m.notes
			}))
		)
	);
</script>

<svelte:head>
	<title>Edit Routine - Strtchy</title>
</svelte:head>

	<form id="edit-routine-form" method="POST" class="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
	<header class="p-6 border-b border-gray-800 sticky top-0 bg-gray-950/95 backdrop-blur z-10">
		<div class="max-w-4xl mx-auto">
			<a href="/routine/{data.routine.id}" class="text-gray-400 hover:text-white text-sm mb-2 inline-block">&larr; Back</a>
			<h1 class="text-3xl font-bold">Edit Routine</h1>
		</div>
	</header>

	<div class="max-w-4xl mx-auto p-6 space-y-8 pb-32">
		{#if form?.missing && form?.missingFields}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
				<strong>Missing required fields:</strong> {form.missingFields.join(', ')}
			</div>
		{/if}

		{#if form?.invalid_values}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
				Rest times must be positive numbers
			</div>
		{/if}

		{#if form?.no_movements}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
				Please add at least one movement to your routine
			</div>
		{/if}

		{#if form?.unauthorized}
			<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
				You must be logged in to edit a routine
			</div>
		{/if}

		<!-- Basic Info -->
		<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6 space-y-4">
			<h2 class="text-xl font-semibold">Basic Information</h2>

			<div>
				<label for="name" class="block text-sm font-medium text-gray-300 mb-2">Routine Name *</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={name}
					class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
					placeholder="Morning Stretch"
					required
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-gray-300 mb-2">Description</label>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="3"
					class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
					placeholder="A quick morning routine to start your day..."
				></textarea>
			</div>
		</section>

		<!-- Settings -->
		<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6 space-y-4">
			<h2 class="text-xl font-semibold">Settings</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="rest_between_movements" class="block text-sm font-medium text-gray-300 mb-2">
						Rest Between Movements (seconds)
					</label>
					<input
						id="rest_between_movements"
						name="rest_between_movements"
						type="number"
						bind:value={restBetweenMovements}
						min="0"
						class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						required
					/>
				</div>

				<div>
					<label for="rest_between_sets" class="block text-sm font-medium text-gray-300 mb-2">
						Rest Between Sets (seconds)
					</label>
					<input
						id="rest_between_sets"
						name="rest_between_sets"
						type="number"
						bind:value={restBetweenSets}
						min="0"
						class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						required
					/>
				</div>
			</div>

			<div class="space-y-3">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="auto_advance"
						bind:checked={autoAdvance}
						value="true"
						class="w-5 h-5 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
					/>
					<span class="text-gray-300">Auto-advance to next movement</span>
				</label>

				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="audio_enabled"
						bind:checked={audioEnabled}
						value="true"
						class="w-5 h-5 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
					/>
					<span class="text-gray-300">Enable audio cues</span>
				</label>

				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="keep_awake"
						bind:checked={keepAwake}
						value="true"
						class="w-5 h-5 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
					/>
					<span class="text-gray-300">Keep screen awake during practice</span>
				</label>
			</div>
		</section>

		<!-- Movements -->
		<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6 space-y-4">
			<h2 class="text-xl font-semibold">Movements ({selectedMovements.length})</h2>

			{#if selectedMovements.length === 0}
				<p class="text-gray-400 text-sm">No movements added yet. Select movements below to get started.</p>
			{:else}
				<div class="space-y-3">
					{#each selectedMovements as movement, index (index)}
						<div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3">
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-3">
									<span class="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold">
										{index + 1}
									</span>
									<h3 class="font-semibold">{movement.name}</h3>
								</div>
								<div class="flex items-center gap-2">
									<button
										type="button"
										onclick={() => moveMovement(index, 'up')}
										disabled={index === 0}
										class="p-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
									>
										↑
									</button>
									<button
										type="button"
										onclick={() => moveMovement(index, 'down')}
										disabled={index === selectedMovements.length - 1}
										class="p-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
									>
										↓
									</button>
									<button
										type="button"
										onclick={() => removeMovement(index)}
										class="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition"
									>
										✕
									</button>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-3 ml-11">
								<div>
									<label for="target_type_{index}" class="block text-xs text-gray-400 mb-1">Target Type</label>
									<select
										id="target_type_{index}"
										bind:value={movement.targetType}
										class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
									>
										<option value="time">Time</option>
										<option value="reps">Repetitions</option>
										<option value="distance">Distance</option>
									</select>
								</div>

								<div>
									<label class="block text-xs text-gray-400 mb-1">Target Value</label>
									<input
										type="number"
										min="1"
										bind:value={movement.targetValue}
										class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								</div>

								<div>
									<label class="block text-xs text-gray-400 mb-1">Unit (optional)</label>
									<input
										type="text"
										bind:value={movement.targetUnit}
										class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="seconds"
									/>
								</div>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
								<div>
									<label class="block text-xs text-gray-400 mb-1">Sets</label>
									<input
										type="number"
										min="1"
										bind:value={movement.sets}
										class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
								</div>

								<div>
									<label class="block text-xs text-gray-400 mb-1">Notes (optional)</label>
									<input
										type="text"
										bind:value={movement.notes}
										class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										placeholder="Focus on form..."
									/>
								</div>
							</div>

							<div class="ml-11 space-y-3">
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										bind:checked={movement.isBilateral}
										class="w-5 h-5 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
									/>
									<span class="text-gray-300 text-sm">Bilateral exercise (left/right sides)</span>
								</label>

								{#if movement.isBilateral}
									<div>
										<label class="block text-xs text-gray-400 mb-1">Switch Sides Duration (seconds)</label>
										<input
											type="number"
											min="0"
											bind:value={movement.switchSidesDuration}
											class="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Add Movements -->
		<section class="bg-gray-800/30 border border-gray-700 rounded-xl p-6 space-y-4">
			<h2 class="text-xl font-semibold">Add Movements</h2>

			{#each Object.entries(groupedMovements) as [category, movementsList]}
				{#if movementsList.length > 0}
					<div>
						<h3 class="text-lg font-medium text-gray-300 mb-3">{category}</h3>
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{#each movementsList as movement}
								<button
									type="button"
									onclick={() => addMovement(movement.id)}
									class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-left hover:border-emerald-500 hover:bg-gray-800 transition group"
								>
									<div class="flex items-start justify-between">
										<h4 class="font-semibold group-hover:text-emerald-400 transition">
											{movement.name}
										</h4>
										<span
											class="text-emerald-500 opacity-0 group-hover:opacity-100 transition text-xl"
										>
											+
										</span>
									</div>
									{#if movement.description}
										<p class="text-sm text-gray-400 mt-1">{movement.description}</p>
									{/if}
									{#if movement.isCustom}
										<span class="inline-block mt-2 text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
											Custom
										</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</section>
		<input type="hidden" name="movements_data" value={movementsData} />
	</div>

	<!-- Fixed bottom button -->
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/95 border-t border-gray-800 backdrop-blur">
		<div class="max-w-4xl mx-auto">
			<button
				type="submit"
				disabled={selectedMovements.length === 0}
				class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-all disabled:cursor-not-allowed"
			>
				Save Changes
			</button>
		</div>
	</div>
</form>
