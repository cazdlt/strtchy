import { db } from '$lib/db';
import { practiceLogs, practiceData, routineMovements, routines, movements } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageData, RequestEvent } from './$types';
import { nanoid } from 'nanoid';

// Helper to create practice log from routine ID
async function _createPracticeLog(routineId: string, userId?: string): Promise<string> {
	const practiceId = nanoid();
	const now = new Date();

	// Create practice log
	await db.insert(practiceLogs).values({
		id: practiceId,
		routineId,
		userId,
		startedAt: now
	});

	return practiceId;
}

export async function load({ params }: { params: { id: string } }) {
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

	// Get all routine movements
	const allRoutineMovements = await db.query.routineMovements.findMany({
		where: eq(routineMovements.routineId, practice.routineId),
		with: {
			movement: true
		},
		orderBy: routineMovements.order
	});

	// Calculate progress (for bilateral, each set = 2 sides)
	const totalSets = allRoutineMovements.reduce((sum, rm) => {
		return sum + (rm.isBilateral ? rm.sets * 2 : rm.sets);
	}, 0);
	const completedSets = practice.practiceData.length;
	const progress = totalSets > 0 ? completedSets / totalSets : 0;

	return {
		practice,
		allRoutineMovements,
		progress,
		totalSets,
		completedSets
	};
}

export const actions = {
	completePractice: async ({ request, params }: RequestEvent) => {
		const formData = await request.formData();
		const notes = formData.get('notes') as string;

		// Update practice log
		const practice = await db.query.practiceLogs.findFirst({
			where: eq(practiceLogs.id, params.id)
		});

		if (!practice) {
			return fail(404, { error: 'Practice not found' });
		}

		// Calculate duration
		const completedAt = new Date();
		const duration = Math.floor((completedAt.getTime() - practice.startedAt.getTime()) / 1000);

		await db
			.update(practiceLogs)
			.set({
				completedAt,
				duration,
				notes: notes || null
			})
			.where(eq(practiceLogs.id, params.id));

		redirect(302, `/practice/${params.id}/summary`);
	},

	completeSet: async ({ request, params }: RequestEvent) => {
		const formData = await request.formData();
		const routineMovementId = formData.get('routineMovementId') as string;
		const setNumber = parseInt(formData.get('setNumber') as string);
		const value = parseInt(formData.get('value') as string);
		const measurementType = formData.get('measurementType') as 'time' | 'reps';
		const customMeasurement = formData.get('customMeasurement') as string;
		const side = formData.get('side') as 'left' | 'right' | null;
		const weight = formData.get('weight');
		const weightUnit = formData.get('weightUnit') as 'lbs' | 'kg' | 'bodyweight' | null;

		if (!routineMovementId || !setNumber || !value) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Create practice data entry
		await db.insert(practiceData).values({
			id: nanoid(),
			practiceLogId: params.id,
			routineMovementId,
			setNumber,
			side,
			value,
			measurementType,
			customMeasurement: customMeasurement || null,
			weight: weight ? parseInt(String(weight)) : null,
			weightUnit,
			completedAt: new Date()
		});

		return { success: true };
	},

	submitRating: async ({ request, params }: RequestEvent) => {
		const formData = await request.formData();
		const routineMovementId = formData.get('routineMovementId') as string;
		const rating = parseInt(formData.get('rating') as string);

		if (!routineMovementId || isNaN(rating)) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Update all practice data entries for this movement with the rating
		await db
			.update(practiceData)
			.set({ rating })
			.where(eq(practiceData.routineMovementId, routineMovementId));

		return { success: true };
	}
};
