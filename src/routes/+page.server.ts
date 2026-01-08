import { db } from '$lib/db';
import { routines, practiceLogs } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatDuration, getRelativeTime } from '$lib/utils/formatting';

export async function load() {
	// Get all routines
	const allRoutines = await db.select().from(routines).orderBy(desc(routines.createdAt));

	// Get recent practices
	const recentPractices = await db
		.select({
			id: practiceLogs.id,
			routineId: practiceLogs.routineId,
			startedAt: practiceLogs.startedAt,
			duration: practiceLogs.duration,
			routineName: routines.name
		})
		.from(practiceLogs)
		.innerJoin(routines, eq(practiceLogs.routineId, routines.id))
		.orderBy(desc(practiceLogs.startedAt))
		.limit(5);

	return {
		routines: allRoutines,
		recentPractices: recentPractices.map((p) => ({
			...p,
			startedAt: getRelativeTime(p.startedAt),
			durationFormatted: p.duration ? formatDuration(p.duration) : null
		}))
	};
}
