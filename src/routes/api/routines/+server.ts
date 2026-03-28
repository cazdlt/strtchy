import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { routines, routineMovements } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { validateBearerToken, requireAuth } from '$lib/api/auth';
import { formatZodError, formatApiError } from '$lib/api/errors';
import { routineSchema } from '$lib/validation/schemas/routine';
import { createRoutine } from '$lib/db/helpers/routines';
import type { RequestEvent } from './$types';

// GET /api/routines - List all routines (public)
export async function GET(event: RequestEvent) {
	try {
		const allRoutines = await db.select().from(routines).orderBy(desc(routines.createdAt));

		const routinesWithCounts = await Promise.all(
			allRoutines.map(async (routine) => {
				const movementsData = await db
					.select()
					.from(routineMovements)
					.where(eq(routineMovements.routineId, routine.id));

				return {
					...routine,
					movementsCount: movementsData.length
				};
			})
		);

		return json({ success: true, routines: routinesWithCounts });
	} catch (err) {
		return json(formatApiError(err), { status: 500 });
	}
}

// POST /api/routines - Create routine (authenticated)
export async function POST(event: RequestEvent) {
	try {
		const { user } = await validateBearerToken(event);
		requireAuth(user);

		const body = await event.request.json();

		const parsed = routineSchema.safeParse(body);
		if (!parsed.success) {
			return json(formatZodError(parsed.error), { status: 400 });
		}

		const routineId = await createRoutine(parsed.data, user?.id);
		const routine = await db.query.routines.findFirst({
			where: eq(routines.id, routineId),
			with: {
				movements: {
					with: { movement: true },
					orderBy: routineMovements.order
				}
			}
		});

		return json({ success: true, routine }, { status: 201 });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}
		if (err instanceof Error && err.message.includes('already exists')) {
			return json({ success: false, error: err.message }, { status: 409 });
		}
		return json(formatApiError(err), { status: 500 });
	}
}
