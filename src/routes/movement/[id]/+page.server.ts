import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageData } from './$types';
import { error } from '@sveltejs/kit';

export async function load({ params }: { params: { id: string } }) {
	const movement = await db.query.movements.findFirst({
		where: eq(movements.id, params.id)
	});

	if (!movement) {
		throw error(404, 'Movement not found');
	}

	return {
		movement
	};
}
