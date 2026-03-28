import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { routineMovements, movements } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateBearerToken, requireAuth } from '$lib/api/auth';
import { formatZodError, formatApiError } from '$lib/api/errors';
import { routineMovementConfigSchema } from '$lib/validation/schemas/routine';
import { updateRoutineMovement, deleteRoutineMovement } from '$lib/db/helpers/routines';
import type { RequestEvent } from './$types';

// PATCH /api/routines/[id]/movements/[routineMovementId] - Update routine movement config (authenticated)
export async function PATCH(event: RequestEvent) {
	try {
		const { user } = await validateBearerToken(event);
		requireAuth(user);

		const body = await event.request.json();

		const parsed = routineMovementConfigSchema.partial().safeParse(body);
		if (!parsed.success) {
			return json(formatZodError(parsed.error), { status: 400 });
		}

		await updateRoutineMovement(event.params.id, event.params.routineMovementId, parsed.data);

		const updated = await db.query.routineMovements.findFirst({
			where: eq(routineMovements.id, event.params.routineMovementId),
			with: { movement: true }
		});

		return json({ success: true, routineMovement: updated });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}
		if (err instanceof Error && err.message.includes('not found')) {
			return json({ success: false, error: err.message }, { status: 404 });
		}
		return json(formatApiError(err), { status: 500 });
	}
}

// DELETE /api/routines/[id]/movements/[routineMovementId] - Remove movement from routine (authenticated)
export async function DELETE(event: RequestEvent) {
	try {
		const { user } = await validateBearerToken(event);
		requireAuth(user);

		await deleteRoutineMovement(event.params.id, event.params.routineMovementId);
		return json({ success: true, message: 'Movement removed from routine' });
	} catch (err) {
		if (err instanceof Error && err.message === 'Unauthorized') {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}
		if (err instanceof Error && err.message.includes('not found')) {
			return json({ success: false, error: err.message }, { status: 404 });
		}
		return json(formatApiError(err), { status: 500 });
	}
}
