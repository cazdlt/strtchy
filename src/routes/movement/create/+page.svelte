<script lang="ts">
	import MovementForm from '$lib/components/forms/MovementForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Create Movement — Strtchy</title>
</svelte:head>

<MovementForm
	mode="create"
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
