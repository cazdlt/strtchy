<script lang="ts">
	import RoutineForm from '$lib/components/forms/RoutineForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Create Routine — Strtchy</title>
</svelte:head>

<RoutineForm
	mode="create"
	availableMovements={data.movements}
	backUrl="/routines"
	backText="Back to Routines"
	formError={form?.error}
	formMissingFields={form?.missingFields}
	formInvalidValues={form?.invalid_values}
	formDuplicateName={form?.existing_name}
	formNoMovements={form?.no_movements}
/>
