<script lang="ts">
	import RoutineForm from '$lib/components/forms/RoutineForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// svelte-ignore state_referenced_locally
	// If form has submittedData (from error resubmission), use that as initial data
	const initialData = form?.submittedData
		? {
				id: data.routine.id,
				name: String(form.submittedData.name || data.routine.name),
				description: String(form.submittedData.description || data.routine.description || ''),
				restBetweenMovements: parseInt(String(form.submittedData.restBetweenMovements)) || data.routine.restBetweenMovements || 30,
				restBetweenSets: parseInt(String(form.submittedData.restBetweenSets)) || data.routine.restBetweenSets || 15,
				autoAdvance: form.submittedData.autoAdvance ?? data.routine.autoAdvance ?? true,
				audioEnabled: form.submittedData.audioEnabled ?? data.routine.audioEnabled ?? true,
				keepAwake: form.submittedData.keepAwake ?? data.routine.keepAwake ?? true,
				movements: (() => {
					const movementsData = form.submittedData.movementsData as string;
					if (movementsData && movementsData.trim() && movementsData !== '[]' && movementsData !== 'null') {
						try {
							const parsed = JSON.parse(movementsData);
							if (Array.isArray(parsed) && parsed.length > 0) {
								return parsed.map((m: any) => ({
									movementId: m.movementId,
									movement: data.movements.find((mov: any) => mov.id === m.movementId) || { id: m.movementId, name: 'Unknown', type: 'timed' },
									target: {
										type: m.targetType,
										value: m.targetValue,
										unit: m.targetUnit
									},
									sets: m.sets,
									isBilateral: m.isBilateral,
									switchSidesDuration: m.switchSidesDuration,
									weight: m.weight,
									weightUnit: m.weightUnit,
									notes: m.notes
								}));
							}
						} catch (e) {
							console.error('Failed to parse movements data:', e);
						}
					}
					return data.routine.movements;
				})()
			}
		: {
				id: data.routine.id,
				name: data.routine.name,
				description: data.routine.description || '',
				restBetweenMovements: data.routine.restBetweenMovements || 30,
				restBetweenSets: data.routine.restBetweenSets || 15,
				autoAdvance: data.routine.autoAdvance ?? true,
				audioEnabled: data.routine.audioEnabled ?? true,
				keepAwake: data.routine.keepAwake ?? true,
				movements: data.routine.movements
			};
</script>

<svelte:head>
	<title>Edit Routine — Strtchy</title>
</svelte:head>

<RoutineForm
	mode="edit"
	{initialData}
	availableMovements={data.movements}
	backUrl="/routine/{data.routine.id}"
	backText="Back to Routine"
	formError={form?.error}
	formMissingFields={form?.missingFields}
	formInvalidValues={form?.invalid_values}
	formDuplicateName={form?.existing_name}
/>
