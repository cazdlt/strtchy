import { db } from '$lib/db';
import { practiceLogs, practiceData, routineMovements, routines, movements, user } from '$lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
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

// Helper to get previous workout stats for a movement
async function getPreviousStats(routineMovementId: string, userId?: string) {
	if (!userId) return null;

	const mostRecentPractice = await db.query.practiceLogs.findFirst({
		where: and(
			eq(practiceLogs.userId, userId),
			sql`${practiceLogs.completedAt} is not null`
		),
		orderBy: desc(practiceLogs.completedAt),
		with: {
			practiceData: true
		}
	});

	if (!mostRecentPractice) return null;

	const previousStats = mostRecentPractice.practiceData.find(
		(pd) => pd.routineMovementId === routineMovementId
	);

	return previousStats || null;
}

export async function load({ params, locals }: { params: { id: string }; locals: App.Locals }) {
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

	// Check if practice is old (read-only)
	const isReadOnly = !!practice.completedAt;

	// Get user preferences
	let userPrefs = null;
	if (locals.user?.id) {
		const userData = await db.query.user.findFirst({
			where: eq(user.id, locals.user.id),
			columns: {
				preferences: true
			}
		});
		userPrefs = userData?.preferences;
	}

	// Get all routine movements
	const allRoutineMovements = await db.query.routineMovements.findMany({
		where: eq(routineMovements.routineId, practice.routineId),
		with: {
			movement: true
		},
		orderBy: routineMovements.order
	});

	// Fetch previous workout stats for each movement
	const previousStatsMap: Record<string, any> = {};
	for (const rm of allRoutineMovements) {
		const prevStats = await getPreviousStats(rm.id, locals.user?.id);
		if (prevStats) {
			previousStatsMap[rm.id] = prevStats;
		}
	}

	// Calculate progress (for bilateral, each set = 2 sides)
	const totalSets = allRoutineMovements.reduce((sum, rm) => {
		return sum + (rm.isBilateral ? rm.sets * 2 : rm.sets);
	}, 0);
	const completedSets = practice.practiceData.length;
	const progress = totalSets > 0 ? completedSets / totalSets : 0;

	return {
		practice,
		allRoutineMovements,
		previousStatsMap,
		userPrefs,
		isReadOnly,
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
		const rating = formData.get('rating');

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
			rating: rating ? parseInt(String(rating)) : null,
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
	},

	updateMovementNotes: async ({ request, params }: RequestEvent) => {
		const formData = await request.formData();
		const routineMovementId = formData.get('routineMovementId') as string;
		const notes = formData.get('notes') as string;

		if (!routineMovementId) {
			return fail(400, { error: 'Missing routineMovementId' });
		}

		await db
			.update(routineMovements)
			.set({ notes: notes || null })
			.where(eq(routineMovements.id, routineMovementId));

		return { success: true };
	},

	updatePracticeSettings: async ({ request, locals }: RequestEvent) => {
		const formData = await request.formData();
		const autoPlay = formData.get('autoPlay') === 'true';
		const audioEnabled = formData.get('audioEnabled') === 'true';
		const keepAwake = formData.get('keepAwake') === 'true';
		const practiceId = formData.get('practiceId') as string;

		if (!practiceId) {
			return fail(400, { error: 'Missing practiceId' });
		}

		const practice = await db.query.practiceLogs.findFirst({
			where: eq(practiceLogs.id, practiceId),
			with: { routine: true }
		});

		if (!practice) {
			return fail(404, { error: 'Practice not found' });
		}

		await db
			.update(routines)
			.set({
				autoAdvance: autoPlay,
				audioEnabled,
				keepAwake
			})
			.where(eq(routines.id, practice.routineId));

		if (locals.user?.id) {
			const userData = await db.query.user.findFirst({
				where: eq(user.id, locals.user.id),
				columns: { preferences: true }
			});

			const currentPrefs = userData?.preferences || {};
			await db
				.update(user)
				.set({
					preferences: {
						...currentPrefs,
						autoAdvance: autoPlay,
						audioEnabled,
						keepAwake
					}
				})
				.where(eq(user.id, locals.user.id));
		}

		return { success: true };
	}
};
