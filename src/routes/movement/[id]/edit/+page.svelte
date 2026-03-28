<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import logo from '$lib/assets/logo.svg';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally
	let name = $state(data.movement.name);
	// svelte-ignore state_referenced_locally
	let description = $state(data.movement.description || '');
	// svelte-ignore state_referenced_locally
	let equipment = $state(data.movement.equipment?.join(', ') || '');
	// svelte-ignore state_referenced_locally
	let type = $state(data.movement.type);
	// svelte-ignore state_referenced_locally
	let defaultValue = $state(String(data.movement.metadata?.defaultTarget?.value || ''));
	// svelte-ignore state_referenced_locally
	let defaultUnit = $state(data.movement.weightUnit || '');
	// svelte-ignore state_referenced_locally
	let timePerRep = $state(data.movement.timePerRep ?? 3);
	// svelte-ignore state_referenced_locally
	let isBilateral = $state(data.movement.isBilateral ?? false);
	// svelte-ignore state_referenced_locally
	let switchSidesDuration = $state(data.movement.switchSidesDuration ?? 5);
	let selectedFile = $state<File | null>(null);
	// svelte-ignore state_referenced_locally
	let filePreview = $state<string | null>(data.movement.illustrationPath || null);
	let removeIllustration = $state(false);

	const originalIllustration = () => data.movement.illustrationPath || null;

	const movementTypes = [
		{ value: 'timed', label: 'Timed', placeholder: '30', unit: 'seconds' },
		{ value: 'reps', label: 'Repetitions', placeholder: '10', unit: null },
		{ value: 'weighted', label: 'Weighted', placeholder: '10', unit: 'reps' },
		{ value: 'resistance_band', label: 'Resistance Band', placeholder: '10', unit: 'reps' }
	];

	const selectedType = $derived(movementTypes.find((t) => t.value === type));

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			selectedFile = file;
			const reader = new FileReader();
			reader.onload = (e) => {
				filePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
			removeIllustration = false;
		}
	}

	function clearFile() {
		selectedFile = null;
		filePreview = originalIllustration();
		removeIllustration = false;
		const fileInput = document.getElementById('illustration') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function removeCurrentIllustration() {
		filePreview = null;
		removeIllustration = true;
		const fileInput = document.getElementById('illustration') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		selectedFile = null;
	}
</script>

<svelte:head>
	<title>Edit Movement - Strtchy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
	<div class="w-full max-w-md">
		<div class="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700">
			<div class="flex items-center justify-between mb-6">
				<h1 class="text-2xl font-bold text-white">Edit Movement</h1>
				<a
					href="/movements"
					class="text-zinc-400 hover:text-zinc-300 transition-colors text-sm"
				>
					Cancel
				</a>
			</div>

			<form method="POST" enctype="multipart/form-data" class="space-y-4">
				{#if form?.error}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						{form.error}
					</div>
				{/if}

				{#if form?.unauthorized}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						You must be logged in to edit a movement
					</div>
				{/if}

				{#if form?.missing}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Please fill in all required fields
					</div>
				{/if}

				{#if form?.invalid_type}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Invalid movement type
					</div>
				{/if}

				{#if form?.invalid_value}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Default value must be a positive number
					</div>
				{/if}

				{#if form?.invalid_file}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						Invalid file type. Please upload SVG, JPG, PNG, or WebP.
					</div>
				{/if}

				<div>
					<label for="name" class="block text-sm font-medium text-zinc-300 mb-2">Name *</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="Hamstring Stretch"
						required
					/>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-zinc-300 mb-2">Description</label>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						rows="3"
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
						placeholder="Brief description of the movement..."
					></textarea>
				</div>

				<div>
					<label for="equipment" class="block text-sm font-medium text-zinc-300 mb-2">Equipment (comma separated)</label>
					<input
						id="equipment"
						name="equipment"
						type="text"
						bind:value={equipment}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="Banda, Pelota, Rodillo..."
					/>
				</div>

				<div>
					<label for="illustration" class="block text-sm font-medium text-zinc-300 mb-2">
						Illustration (optional)
					</label>
					<div class="space-y-3">
						<input
							id="illustration"
							name="illustration"
							type="file"
							accept="image/svg+xml,image/jpeg,image/png,image/webp"
							oninput={handleFileSelect}
							class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
						/>
						{#if filePreview}
							<div class="relative">
								<img
									src={filePreview}
									alt="Preview"
									class="w-32 h-32 object-contain bg-zinc-900/50 rounded-lg border border-zinc-600"
								/>
								<div class="absolute top-1 right-1 flex gap-1">
									<button
										type="button"
										onclick={clearFile}
										class="bg-zinc-600 hover:bg-zinc-700 text-white rounded-full p-1 text-xs"
										aria-label="Remove new file"
									>
										✕
									</button>
									<button
										type="button"
										onclick={removeCurrentIllustration}
										class="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs"
										aria-label="Remove illustration"
										title="Remove illustration"
									>
										🗑️
									</button>
								</div>
							</div>
						{:else}
							<p class="text-xs text-zinc-500">Supported formats: SVG, JPG, PNG, WebP</p>
						{/if}
						<input type="hidden" name="remove_illustration" value={removeIllustration ? 'true' : ''} />
					</div>
				</div>

				<div>
					<label for="type" class="block text-sm font-medium text-zinc-300 mb-2">Type *</label>
					<select
						id="type"
						name="type"
						bind:value={type}
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						required
					>
						{#each movementTypes as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="default_value" class="block text-sm font-medium text-zinc-300 mb-2">
						Default Target Value * {#if selectedType?.unit}
							<span class="text-zinc-500">({selectedType.unit})</span>
						{/if}
					</label>
					<input
						id="default_value"
						name="default_value"
						type="number"
						bind:value={defaultValue}
						min="1"
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
					placeholder={selectedType?.placeholder}
					required
				/>
			</div>

			{#if type !== 'timed'}
				<div>
					<label for="time_per_rep" class="block text-sm font-medium text-zinc-300 mb-2">
						Seconds per Rep (Auto-advance)
					</label>
					<input
						id="time_per_rep"
						name="time_per_rep"
						type="number"
						bind:value={timePerRep}
						min="1"
						max="60"
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="3"
					/>
					<p class="text-xs text-zinc-500 mt-1">
						Set to 0 to disable auto-advance
					</p>
				</div>
			{/if}

			{#if type === 'weighted' || type === 'resistance_band'}
					<div>
						<label for="weight_unit" class="block text-sm font-medium text-zinc-300 mb-2">
							Default Weight Unit *
						</label>
						<select
							id="weight_unit"
							name="weight_unit"
							bind:value={defaultUnit}
							class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
							required
						>
							<option value="">Select unit</option>
							<option value="lbs">lbs</option>
							<option value="kg">kg</option>
							<option value="bodyweight">Bodyweight</option>
						</select>
					</div>
				{/if}

				<div class="border-t border-zinc-700 pt-4 mt-4">
					<h3 class="text-lg font-semibold text-white mb-3">Bilateral Settings</h3>
					<p class="text-sm text-zinc-400 mb-4">
						Mark this as bilateral if the exercise requires switching between left and right sides.
					</p>
					<div class="space-y-4">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="is_bilateral"
								bind:checked={isBilateral}
								class="w-5 h-5 rounded border-zinc-600 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-800"
							/>
							<span class="text-zinc-300">This is a bilateral exercise</span>
						</label>

						{#if isBilateral}
							<div>
								<label for="switch_sides_duration" class="block text-sm font-medium text-zinc-300 mb-2">
									Switch Sides Duration (seconds)
								</label>
								<input
									id="switch_sides_duration"
									name="switch_sides_duration"
									type="number"
									bind:value={switchSidesDuration}
									min="0"
									class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
								/>
							</div>
						{/if}
					</div>
				</div>

				<button
					type="submit"
					class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
				>
					Save Changes
				</button>
			</form>
		</div>
	</div>
</div>
