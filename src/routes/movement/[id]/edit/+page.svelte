<script lang="ts">
	import MovementForm from '$lib/components/forms/MovementForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally
	const initialData = {
		name: data.movement.name,
		description: data.movement.description || '',
		equipment: data.movement.equipment || [],
		type: data.movement.type,
		metadata: data.movement.metadata,
		weightUnit: data.movement.weightUnit || '',
		timePerRep: data.movement.timePerRep ?? 3,
		isBilateral: data.movement.isBilateral ?? false,
		switchSidesDuration: data.movement.switchSidesDuration ?? 5,
		illustrationPath: data.movement.illustrationPath
	};
</script>

<svelte:head>
	<title>Edit Movement — Strtchy</title>
</svelte:head>

<MovementForm
	mode="edit"
	{initialData}
	backUrl="/movements"
	backText="Back to Movements"
	formError={form?.error}
	formUnauthorized={form?.unauthorized}
	formMissing={form?.missing}
	formDuplicateName={form?.existing_name}
	formInvalidType={form?.invalid_type}
	formInvalidValue={form?.invalid_value}
	formInvalidFile={form?.invalid_file}
/>
