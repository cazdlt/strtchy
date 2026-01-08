import { db } from '$lib/db';
import { practiceLogs, practiceData, routineMovements, movements } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageData } from '../$types';

export async function load({ params }: { params: { id: string } }): Promise<PageData> {
	const practice = await db.query.practiceLogs.findFirst({
		where: eq(practiceLogs.id, params.id),
		with: {
			routine: true,
			practiceData: {
				with: {
					routineMovement: {
						with: {
							movement: true
						}
					}
				},
				orderBy: practiceData.completedAt
			}
		}
	});

	if (!practice) {
		throw new Error('Practice not found');
	}

	return {
		practice
	};
}
