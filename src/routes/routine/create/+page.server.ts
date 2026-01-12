import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { routines, routineMovements, movements } from '$lib/db/schema';
import { nanoid } from 'nanoid';
import { desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allMovements = await db.select().from(movements).orderBy(desc(movements.createdAt));

	return {
		movements: allMovements,
		user: locals.user
	};
};

export const actions: Actions = {
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

		const missingFields: string[] = [];
		if (!name) missingFields.push('routine name');
		if (!restBetweenMovements) missingFields.push('rest between movements');
		if (!restBetweenSets) missingFields.push('rest between sets');
		if (!movementsData) missingFields.push('movements');

		if (missingFields.length > 0) {
			return fail(400, { missing: true, missingFields, submittedData: { name, description, restBetweenMovements, restBetweenSets, autoAdvance, audioEnabled, keepAwake, movementsData: String(movementsData || '[]') } });
		}

		if (typeof name !== 'string' || typeof restBetweenMovements !== 'string' || typeof restBetweenSets !== 'string' || typeof movementsData !== 'string') {
			return fail(400, { invalid: true, submittedData: { name, description, restBetweenMovements, restBetweenSets, autoAdvance, audioEnabled, keepAwake, movementsData: String(movementsData || '[]') } });
		}

		const restMovements = parseInt(restBetweenMovements, 10);
		const restSets = parseInt(restBetweenSets, 10);

		if (isNaN(restMovements) || restMovements < 0 || isNaN(restSets) || restSets < 0) {
			return fail(400, { invalid_values: true, submittedData: { name, description, restBetweenMovements, restBetweenSets, autoAdvance, audioEnabled, keepAwake, movementsData: String(movementsData || '[]') } });
		}

		let parsedMovements;
		try {
			parsedMovements = JSON.parse(movementsData);
			if (!Array.isArray(parsedMovements) || parsedMovements.length === 0) {
				return fail(400, { no_movements: true, submittedData: { name, description, restBetweenMovements, restBetweenSets, autoAdvance, audioEnabled, keepAwake, movementsData: String(movementsData || '[]') } });
			}
		} catch {
			return fail(400, { invalid_movements_data: true, submittedData: { name, description, restBetweenMovements, restBetweenSets, autoAdvance, audioEnabled, keepAwake, movementsData: String(movementsData || '[]') } });
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
				isBilateral: movement.isBilateral ?? false,
				switchSidesDuration: movement.switchSidesDuration ?? 5,
				weight: movement.weight ? parseInt(String(movement.weight)) : null,
				weightUnit: movement.weightUnit as 'lbs' | 'kg' | 'bodyweight' || null,
				notes: movement.notes || null
			});
		}

		throw redirect(303, `/routine/${routineId}`);
	}
};
