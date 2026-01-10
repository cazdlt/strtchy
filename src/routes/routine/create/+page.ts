import { db } from '$lib/db';
import { movements } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allMovements = await db
		.select({
			id: movements.id,
			name: movements.name,
			description: movements.description,
			type: movements.type,
			metadata: movements.metadata,
			illustrationPath: movements.illustrationPath,
			isCustom: movements.isCustom,
			userId: movements.userId
		})
		.from(movements);

	return {
		movements: allMovements
	};
}
