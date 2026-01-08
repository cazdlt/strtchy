import { db } from '$lib/db';
import { routines, routineMovements, practiceLogs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageData, ActionFailure, RequestEvent } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

export async function load({ params }: { params: { id: string } }): Promise<PageData> {
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

	return {
		routine
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
