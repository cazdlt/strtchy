import { db } from "$lib/db";
import { practiceLogs, routines } from "$lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { formatDuration, getRelativeTime } from "$lib/utils/formatting";

const PAGE_SIZE = 20;

export async function load({ url, locals }: { url: URL; locals: App.Locals }) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Get total count for pagination
  const [countResult] = await db
    .select({ total: count() })
    .from(practiceLogs);

  const total = countResult?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Get paginated practices
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
    .orderBy(desc(practiceLogs.startedAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return {
    user: locals.user ?? null,
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
