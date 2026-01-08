import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { routines, routineMovements } from '$lib/db/schema';
import { nanoid } from 'nanoid';

	export const actions = {
		default: async ({ request, locals }) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const description = formData.get('description') || null;
		const restBetweenMovements = formData.get('rest_between_movements');
		const restBetweenSets = formData.get('rest_between_sets');
		const autoAdvance = formData.get('auto_advance') === 'true';
		const audioEnabled = formData.get('audio_enabled') === 'true';
		const keepAwake = formData.get('keep_awake') === 'true';

		const movementsData = formData.get('movements_data');

		if (!name || !restBetweenMovements || !restBetweenSets || !movementsData) {
			return fail(400, { missing: true });
		}

		if (typeof name !== 'string' || typeof restBetweenMovements !== 'string' || typeof restBetweenSets !== 'string' || typeof movementsData !== 'string') {
			return fail(400, { invalid: true });
		}

		const restMovements = parseInt(restBetweenMovements, 10);
		const restSets = parseInt(restBetweenSets, 10);

		if (isNaN(restMovements) || restMovements < 0 || isNaN(restSets) || restSets < 0) {
			return fail(400, { invalid_values: true });
		}

		let parsedMovements;
		try {
			parsedMovements = JSON.parse(movementsData);
			if (!Array.isArray(parsedMovements) || parsedMovements.length === 0) {
				return fail(400, { no_movements: true });
			}
		} catch {
			return fail(400, { invalid_movements_data: true });
		}

		const routineId = nanoid();

		await db.insert(routines).values({
			id: routineId,
			name: String(name),
			description: description ? String(description) : null,
			userId: locals.user?.id,
			restBetweenMovements: restMovements,
			restBetweenSets: restSets,
			autoAdvance,
			audioEnabled,
			keepAwake,
			isCustom: true,
			createdAt: new Date()
		});

		for (let i = 0; i < parsedMovements.length; i++) {
			const movement = parsedMovements[i];
			await db.insert(routineMovements).values({
				id: nanoid(),
				routineId,
				movementId: movement.movementId,
				order: i,
				target: {
					type: movement.targetType,
					value: movement.targetValue,
					unit: movement.targetUnit
				},
				sets: movement.sets || 1,
				notes: movement.notes || null
			});
		}

		throw redirect(303, `/routine/${routineId}`);
	}
};
