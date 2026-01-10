import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { routines, routineMovements, movements } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const routine = await db.query.routines.findFirst({
		where: eq(routines.id, params.id),
		with: {
			movements: {
				with: {
					movement: true
				},
				orderBy: routineMovements.order
			}
		}
	});

	if (!routine) {
		throw redirect(303, '/routines');
	}

	const allMovements = await db.select().from(movements).orderBy(movements.createdAt);

	return {
		routine,
		movements: allMovements,
		user: locals.user
	};
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { unauthorized: true });
		}

		const routine = await db.query.routines.findFirst({
			where: eq(routines.id, params.id)
		});

		if (!routine) {
			return fail(404, { not_found: true });
		}

		try {
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
				return fail(400, { missing: true, missingFields });
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

			await db.update(routines)
				.set({
					name: String(name),
					description: description ? String(description) : null,
					restBetweenMovements: restMovements,
					restBetweenSets: restSets,
					autoAdvance,
					audioEnabled,
					keepAwake
				})
				.where(eq(routines.id, params.id));

			await db.delete(routineMovements).where(eq(routineMovements.routineId, params.id));

			for (let i = 0; i < parsedMovements.length; i++) {
				const movement = parsedMovements[i];
				await db.insert(routineMovements).values({
					id: crypto.randomUUID(),
					routineId: params.id,
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

			throw redirect(303, `/routine/${params.id}`);
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}
			console.error('Error updating routine:', error);
			return fail(500, { error: 'Failed to update routine' });
		}
	}
};
