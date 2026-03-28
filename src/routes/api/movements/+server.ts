import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { validateBearerToken, requireAuth } from '$lib/api/auth';
import { formatZodError, formatApiError } from '$lib/api/errors';
import { movementSchema } from '$lib/validation/schemas/movement';
import { createMovement } from '$lib/db/helpers/movements';
import type { RequestEvent } from './$types';

// GET /api/movements - List all movements (public)
export async function GET(event: RequestEvent) {
	try {
		const allMovements = await db.select().from(movements).orderBy(desc(movements.createdAt));
		return json({ success: true, movements: allMovements });
	} catch (err) {
		return json(formatApiError(err), { status: 500 });
	}
}

// POST /api/movements - Create movement (authenticated)
export async function POST(event: RequestEvent) {
	try {
		const { user } = await validateBearerToken(event);
		requireAuth(user);

		const body = await event.request.json();

		const parsed = movementSchema.safeParse(body);
		if (!parsed.success) {
			return json(formatZodError(parsed.error), { status: 400 });
		}

		const movementId = await createMovement(parsed.data, user.id);
		const movement = await db.query.movements.findFirst({
			where: eq(movements.id, movementId)
		});

		return json({ success: true, movement }, { status: 201 });
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
