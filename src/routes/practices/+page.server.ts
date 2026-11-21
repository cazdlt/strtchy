import { db } from "$lib/db";
import { practiceLogs, routines } from "$lib/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { formatDuration, getRelativeTime } from "$lib/utils/formatting";
import { redirect } from "@sveltejs/kit";

const PAGE_SIZE = 20;

export async function load({ url, locals }: { url: URL; locals: App.Locals }) {
  if (!locals.user) {
    throw redirect(302, "/login?redirectTo=/practices");
  }

  const userId = locals.user.id;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Get total count for pagination (only user's practices)
  const [countResult] = await db
    .select({ total: count() })
    .from(practiceLogs)
    .where(eq(practiceLogs.userId, userId));

  const total = countResult?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Get paginated practices (only user's practices)
  const practices = await db
    .select({
      id: practiceLogs.id,
      routineId: practiceLogs.routineId,
      startedAt: practiceLogs.startedAt,
      completedAt: practiceLogs.completedAt,
      duration: practiceLogs.duration,
      routineName: routines.name,
    })
    .from(practiceLogs)
    .innerJoin(routines, eq(practiceLogs.routineId, routines.id))
    .where(eq(practiceLogs.userId, userId))
    .orderBy(desc(practiceLogs.startedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return {
    user: locals.user,
    practices: practices.map((p) => ({
      ...p,
      startedAtFormatted: getRelativeTime(p.startedAt),
      durationFormatted: p.duration != null ? formatDuration(p.duration) : null,
      isCompleted: p.completedAt != null,
    })),
    pagination: {
      page,
      totalPages,
      total,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}
