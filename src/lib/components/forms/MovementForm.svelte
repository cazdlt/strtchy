<script lang="ts">
	import { ArrowLeft, X, Trash } from 'phosphor-svelte';

	interface MovementData {
		name: string;
		description?: string;
		equipment?: string[];
		type: string;
		metadata?: {
			defaultTarget?: {
				value?: number;
				unit?: string;
			};
		} | null;
		weightUnit?: string;
		timePerRep?: number;
		isBilateral?: boolean;
		switchSidesDuration?: number;
		illustrationPath?: string | null;
	}

	interface Props {
		mode: 'create' | 'edit';
		initialData?: MovementData | null;
		formError?: string | null;
		formUnauthorized?: boolean;
		formMissing?: boolean;
		formDuplicateName?: string | null;
		formInvalidType?: boolean;
		formInvalidValue?: boolean;
		formInvalidFile?: boolean;
		backUrl: string;
		backText: string;
	}

	let {
		mode,
		initialData = null,
		formError,
		formUnauthorized,
		formMissing,
		formDuplicateName,
		formInvalidType,
		formInvalidValue,
		formInvalidFile,
		backUrl,
		backText
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let name = $state(initialData?.name ?? '');
	// svelte-ignore state_referenced_locally
	let description = $state(initialData?.description ?? '');
	// svelte-ignore state_referenced_locally
	let equipment = $state(initialData?.equipment?.join(', ') ?? '');
	// svelte-ignore state_referenced_locally
	let type = $state(initialData?.type ?? 'timed');
	// svelte-ignore state_referenced_locally
	let defaultValue = $state(String(initialData?.metadata?.defaultTarget?.value ?? ''));
	// svelte-ignore state_referenced_locally
	let defaultUnit = $state(initialData?.weightUnit ?? '');
	// svelte-ignore state_referenced_locally
	let timePerRep = $state(initialData?.timePerRep ?? 3);
	// svelte-ignore state_referenced_locally
	let isBilateral = $state(initialData?.isBilateral ?? false);
	// svelte-ignore state_referenced_locally
	let switchSidesDuration = $state(initialData?.switchSidesDuration ?? 5);
	let selectedFile = $state<File | null>(null);
	// svelte-ignore state_referenced_locally
	let filePreview = $state<string | null>(initialData?.illustrationPath ?? null);
	let removeIllustration = $state(false);

	const originalIllustration = () => initialData?.illustrationPath ?? null;

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

<div class="min-h-screen bg-base">
	<header class="sticky top-0 z-10 bg-surface border-b-2 border-accent-track">
		<div class="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
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

	<main class="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-8 pb-32">
		<!-- Title Section -->
		<section class="mb-8 pb-6 border-b-2 border-accent-track">
			<div class="space-y-2">
				<div class="flex items-baseline gap-4">
					<span class="text-text-muted text-sm uppercase tracking-widest font-body">MOVEMENT</span>
					<div class="flex-1 h-px bg-accent-track"></div>
				</div>
				<h1 class="font-display text-5xl sm:text-6xl text-text-primary tracking-wide leading-none">
					{mode === 'create' ? 'CREATE' : 'EDIT'}
				</h1>
			</div>
		</section>

		<!-- Form Card -->
		<div
			class="bg-surface border-t-4 border-t-accent-primary p-6 sm:p-8"
			style="box-shadow: var(--shadow-elevated);"
		>
			<form id="movement-form" method="POST" enctype="multipart/form-data" class="space-y-6">
				<!-- Error Messages -->
				{#if formError}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						{formError}
					</div>
				{/if}

				{#if formUnauthorized}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						You must be logged in to {mode} a movement
					</div>
				{/if}

				{#if formMissing}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						Please fill in all required fields
					</div>
				{/if}

				{#if formDuplicateName}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						A movement with the name "{formDuplicateName}" already exists
					</div>
				{/if}

				{#if formInvalidType}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						Invalid movement type
					</div>
				{/if}

				{#if formInvalidValue}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						Default value must be a positive number
					</div>
				{/if}

				{#if formInvalidFile}
					<div class="p-4 bg-error/10 border-2 border-error text-error">
						Invalid file type. Please upload SVG, JPG, PNG, or WebP.
					</div>
				{/if}

				<!-- Name -->
				<div class="space-y-2">
					<label for="name" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
						Name <span class="text-error">*</span>
					</label>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
						placeholder="Hamstring Stretch"
						required
					/>
				</div>

				<!-- Description -->
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
						placeholder="Brief description of the movement..."
					></textarea>
				</div>

				<!-- Equipment -->
				<div class="space-y-2">
					<label for="equipment" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
						Equipment (comma separated)
					</label>
					<input
						id="equipment"
						name="equipment"
						type="text"
						bind:value={equipment}
						class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
						placeholder="Banda, Pelota, Rodillo..."
					/>
				</div>

				<!-- Type -->
				<div class="space-y-2">
					<label for="type" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
						Type <span class="text-error">*</span>
					</label>
					<select
						id="type"
						name="type"
						bind:value={type}
						class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
						required
					>
						{#each movementTypes as t}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</div>

				<!-- Default Target Value -->
				<div class="space-y-2">
					<label for="default_value" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
						Default Target Value {#if selectedType?.unit}
							<span class="text-text-muted">({selectedType.unit})</span>
						{/if}
						<span class="text-error">*</span>
					</label>
					<input
						id="default_value"
						name="default_value"
						type="number"
						bind:value={defaultValue}
						min="1"
						class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
						placeholder={selectedType?.placeholder}
						required
					/>
				</div>

				<!-- Illustration -->
				<div class="space-y-3">
					<label for="illustration" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
						Illustration (optional)
					</label>
					<input
						id="illustration"
						name="illustration"
						type="file"
						accept="image/svg+xml,image/jpeg,image/png,image/webp"
						oninput={handleFileSelect}
						class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-title file:bg-accent-primary file:text-white hover:file:bg-accent-primary-light"
					/>
					{#if filePreview}
						<div class="relative inline-block">
							<img
								src={filePreview}
								alt="Preview"
								class="w-32 h-32 object-contain bg-inset border-2 border-accent-track"
							/>
							<div class="absolute top-1 right-1 flex gap-1">
								{#if selectedFile}
									<button
										type="button"
										onclick={clearFile}
										class="w-6 h-6 flex items-center justify-center bg-surface-elevated hover:bg-text-muted text-text-primary transition-colors"
										aria-label="Remove new file"
									>
										<X weight="bold" size={14} />
									</button>
								{/if}
								{#if mode === 'edit' && originalIllustration()}
									<button
										type="button"
										onclick={removeCurrentIllustration}
										class="w-6 h-6 flex items-center justify-center bg-error hover:bg-error/80 text-white transition-colors"
										aria-label="Remove illustration"
										title="Remove illustration"
									>
										<Trash weight="bold" size={14} />
									</button>
								{/if}
							</div>
						</div>
					{:else}
						<p class="text-xs text-text-muted">Supported formats: SVG, JPG, PNG, WebP</p>
					{/if}
					<input type="hidden" name="remove_illustration" value={removeIllustration ? 'true' : ''} />
				</div>

				<!-- Time per Rep (non-timed only) -->
				{#if type !== 'timed'}
					<div class="space-y-2">
						<label for="time_per_rep" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
							Seconds per Rep (Auto-advance)
						</label>
						<input
							id="time_per_rep"
							name="time_per_rep"
							type="number"
							bind:value={timePerRep}
							min="0"
							max="60"
							class="w-full px-4 py-3 bg-inset text-text-primary placeholder-text-muted border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
						/>
						<p class="text-xs text-text-muted">Set to 0 to disable auto-advance</p>
					</div>
				{/if}

				<!-- Weight Unit (weighted/resistance only) -->
				{#if type === 'weighted' || type === 'resistance_band'}
					<div class="space-y-2">
						<label for="weight_unit" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
							Default Weight Unit <span class="text-error">*</span>
						</label>
						<select
							id="weight_unit"
							name="weight_unit"
							bind:value={defaultUnit}
							class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
							required
						>
							<option value="">Select unit</option>
							<option value="lbs">lbs</option>
							<option value="kg">kg</option>
							<option value="bodyweight">Bodyweight</option>
						</select>
					</div>
				{/if}

				<!-- Bilateral Section -->
				<div class="border-t-2 border-accent-track pt-6 mt-6">
					<div class="space-y-2 mb-4">
						<h3 class="font-display text-2xl text-text-primary tracking-wider">BILATERAL SETTINGS</h3>
						<p class="text-text-secondary text-sm">
							Mark this as bilateral if the exercise requires switching between left and right sides.
						</p>
					</div>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="is_bilateral"
							bind:checked={isBilateral}
							class="w-5 h-5 border-2 border-accent-track bg-inset text-accent-primary focus:ring-accent-primary"
						/>
						<span class="text-text-primary">This is a bilateral exercise</span>
					</label>

					{#if isBilateral}
						<div class="mt-4 space-y-2">
							<label for="switch_sides_duration" class="block font-title text-sm uppercase tracking-wider text-text-secondary">
								Switch Sides Duration (seconds)
							</label>
							<input
								id="switch_sides_duration"
								name="switch_sides_duration"
								type="number"
								bind:value={switchSidesDuration}
								min="0"
								class="w-full px-4 py-3 bg-inset text-text-primary border-2 border-accent-track focus:border-accent-primary focus:outline-none transition-colors"
							/>
						</div>
					{/if}
				</div>
			</form>
		</div>
	</main>

	<!-- Fixed Bottom Button -->
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t-2 border-accent-track" style="box-shadow: var(--shadow-floating);">
		<div class="max-w-3xl mx-auto">
			<button
				type="submit"
				form="movement-form"
				class="w-full bg-accent-primary hover:bg-accent-primary-light text-white py-4 px-6 transition-colors font-display text-lg tracking-widest uppercase"
			>
				{mode === 'create' ? 'Create Movement' : 'Save Changes'}
			</button>
		</div>
	</div>
</div>

<style>
	form {
		display: contents;
	}
</style>
