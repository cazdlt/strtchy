<script lang="ts">
	let { form } = $props();
	let name = $state('');
	let description = $state('');
	let type = $state('timed');
	let defaultValue = $state('');
	let defaultUnit = $state('');
	let isBilateral = $state(false);
	let switchSidesDuration = $state(5);
	let selectedFile = $state<File | null>(null);
	let filePreview = $state<string | null>(null);

	const movementTypes = [
		{ value: 'timed', label: 'Timed', placeholder: '30', unit: 'seconds' },
		{ value: 'reps', label: 'Repetitions', placeholder: '10', unit: null },
		{ value: 'weighted', label: 'Weighted', placeholder: '10', unit: 'reps' },
		{ value: 'resistance', label: 'Resistance', placeholder: '10', unit: 'reps' }
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
		}
	}

	function clearFile() {
		selectedFile = null;
		filePreview = null;
		const fileInput = document.getElementById('illustration') as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<svelte:head>
	<title>Create Movement - Strtchy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
	<div class="w-full max-w-md">
		<div class="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700">
			<h1 class="text-3xl font-bold text-white mb-2 text-center">Create Movement</h1>
			<p class="text-zinc-400 mb-8 text-center">Add a custom movement to your library</p>

 			<form method="POST" enctype="multipart/form-data" class="space-y-4">
 				{#if form?.error}
 					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
 						{form.error}
 					</div>
 				{/if}

 				{#if form?.unauthorized}
 					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
 						You must be logged in to create a movement
 					</div>
 				{/if}

  				{#if form?.missing}
  					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
  						Please fill in all required fields
  					</div>
  				{/if}

				{#if form?.duplicate_name}
					<div class="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
						A movement with the name "{form?.existing_name}" already exists
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
						class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
						placeholder="Banda, Pelota, Rodillo..."
					/>
				</div>

				<div>
					<label for="illustration" class="block text-sm font-medium text-zinc-300 mb-2">Illustration (optional)</label>
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
								<button
									type="button"
									onclick={clearFile}
									class="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs"
									aria-label="Remove file"
								>
									✕
								</button>
							</div>
						{:else}
							<p class="text-xs text-zinc-500">
								Supported formats: SVG, JPG, PNG, WebP
							</p>
						{/if}
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

				{#if type === 'weighted' || type === 'resistance'}
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
					Create Movement
				</button>
			</form>

			<p class="mt-6 text-center text-zinc-400 text-sm">
				<a href="/" class="text-emerald-400 hover:text-emerald-300 font-medium">Back to Home</a>
			</p>
		</div>
	</div>
</div>
