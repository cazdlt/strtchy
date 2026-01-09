import { db } from '$lib/db';
import { routines, practiceLogs } from '$lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatDuration, getRelativeTime } from '$lib/utils/formatting';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }: { locals: App.Locals }) {
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
		user: locals.user,
		routines: allRoutines,
		recentPractices: recentPractices.map((p) => ({
			...p,
			startedAt: getRelativeTime(p.startedAt),
			durationFormatted: p.duration ? formatDuration(p.duration) : null
		}))
	};
}

export const actions = {
	logout: async ({ cookies }: { cookies: import('@sveltejs/kit').Cookies }) => {
		cookies.delete('better-auth.session_token', { path: '/' });
		redirect(302, '/');
	}
};
