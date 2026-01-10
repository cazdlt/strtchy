import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allMovements = await db.select().from(movements).orderBy(desc(movements.createdAt));

	return {
		movements: allMovements,
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

		const movement = await db.select().from(movements).where(eq(movements.id, id)).get();

		if (!movement) {
			return fail(404, { not_found: true });
		}

		await db.delete(movements).where(eq(movements.id, id));
		throw redirect(303, '/movements');
	}
};