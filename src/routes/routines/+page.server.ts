import { db } from '$lib/db';
import { routines, routineMovements } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { calculateRoutineDuration } from '$lib/utils/formatting';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allRoutines = await db.select().from(routines).orderBy(desc(routines.createdAt));

	const routinesWithCounts = await Promise.all(
		allRoutines.map(async (routine) => {
			const movementsData = await db
				.select()
				.from(routineMovements)
				.where(eq(routineMovements.routineId, routine.id))
				.then((rows) => rows);

			const movementsCount = movementsData.length;

			const estimatedDuration = calculateRoutineDuration(
				movementsData,
				routine.restBetweenMovements,
				routine.restBetweenSets
			);

			return { ...routine, movementsCount, estimatedDuration };
		})
	);

	return {
		routines: routinesWithCounts,
		user: locals.user
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { unauthorized: true });
		}

		const formData = await request.formData();
		const id = formData.get('id');

		if (!id || typeof id !== 'string') {
			return fail(400, { missing: true });
		}

		const routine = await db.select().from(routines).where(eq(routines.id, id)).get();

		if (!routine) {
			return fail(404, { not_found: true });
		}

		await db.delete(routines).where(eq(routines.id, id));
		throw redirect(303, '/routines');
	}
};
