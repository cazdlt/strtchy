<script lang="ts">
	let { form } = $props();
	let name = $state('');
	let description = $state('');
	let type = $state('timed');
	let defaultValue = $state('');
	let defaultUnit = $state('');

	const movementTypes = [
		{ value: 'timed', label: 'Timed', placeholder: '30', unit: 'seconds' },
		{ value: 'reps', label: 'Repetitions', placeholder: '10', unit: null },
		{ value: 'count', label: 'Count', placeholder: '10', unit: null },
		{ value: 'distance', label: 'Distance', placeholder: '100', unit: 'meters' }
	];

	const selectedType = $derived(movementTypes.find((t) => t.value === type));
</script>

<svelte:head>
	<title>Create Movement - Strtchy</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-4">
	<div class="w-full max-w-md">
		<div class="bg-zinc-800/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700">
			<h1 class="text-3xl font-bold text-white mb-2 text-center">Create Movement</h1>
			<p class="text-zinc-400 mb-8 text-center">Add a custom movement to your library</p>

			<form method="POST" class="space-y-4">
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

				{#if type === 'distance'}
					<div>
						<label for="default_unit" class="block text-sm font-medium text-zinc-300 mb-2">
							Unit
						</label>
						<input
							id="default_unit"
							name="default_unit"
							type="text"
							bind:value={defaultUnit}
							class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
							placeholder="meters"
						/>
					</div>
				{/if}

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
