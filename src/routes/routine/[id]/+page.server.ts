import { db } from '$lib/db';
import { routines, routineMovements, practiceLogs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageData, ActionsFailure, RequestEvent } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { calculateRoutineDuration } from '$lib/utils/formatting';

export async function load({ params, locals }: { params: { id: string }; locals: App.Locals }) {
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
		throw new Error('Routine not found');
	}

	const estimatedDuration = calculateRoutineDuration(
		routine.movements,
		routine.restBetweenMovements,
		routine.restBetweenSets
	);

	const allEquipment = new Set<string>();
	for (const rm of routine.movements) {
		if (rm.movement.equipment && Array.isArray(rm.movement.equipment)) {
			for (const item of rm.movement.equipment) {
				allEquipment.add(item);
			}
		}
	}

	return {
		routine,
		user: locals.user,
		estimatedDuration,
		equipment: Array.from(allEquipment).sort()
	};
}

export const actions = {
	startPractice: async ({ request, params }: RequestEvent) => {
		// Create a new practice log
		const practiceLogId = nanoid();
		const now = new Date();

		await db.insert(practiceLogs).values({
			id: practiceLogId,
			routineId: params.id,
			startedAt: now
		});

		redirect(302, `/practice/${practiceLogId}`);
	}
};
