import { db } from "$lib/db";
import { routines, practiceLogs, movements, routineMovements } from "$lib/db/schema";
import { desc, eq, count, sql } from "drizzle-orm";
import { formatDuration, getRelativeTime } from "$lib/utils/formatting";
import { auth } from "$lib/auth";
import { redirect } from "@sveltejs/kit";

export async function load({ locals }: { locals: App.Locals }) {
  // Get all routines with movement counts
  const allRoutines = await db
    .select({
      id: routines.id,
      name: routines.name,
      description: routines.description,
      userId: routines.userId,
      restBetweenMovements: routines.restBetweenMovements,
      restBetweenSets: routines.restBetweenSets,
      autoAdvance: routines.autoAdvance,
      audioEnabled: routines.audioEnabled,
      keepAwake: routines.keepAwake,
      isCustom: routines.isCustom,
      createdAt: routines.createdAt,
      movementCount: sql<number>`count(${routineMovements.id})`.as("movement_count"),
    })
    .from(routines)
    .leftJoin(routineMovements, eq(routines.id, routineMovements.routineId))
    .groupBy(routines.id)
    .orderBy(desc(routines.createdAt));

  // Get movements for home page preview
  const allMovements = await db
    .select()
    .from(movements)
    .orderBy(desc(movements.createdAt));

  // Get recent practices
  const recentPractices = await db
    .select({
      id: practiceLogs.id,
      routineId: practiceLogs.routineId,
      startedAt: practiceLogs.startedAt,
      duration: practiceLogs.duration,
      routineName: routines.name,
    })
    .from(practiceLogs)
    .innerJoin(routines, eq(practiceLogs.routineId, routines.id))
    .orderBy(desc(practiceLogs.startedAt))
    .limit(5);

  return {
    user: locals.user,
    routines: allRoutines,
    movements: allMovements,
    recentPractices: recentPractices.map((p) => ({
      ...p,
      startedAt: getRelativeTime(p.startedAt),
      durationFormatted: p.duration ? formatDuration(p.duration) : null,
    })),
  };
}

export const actions = {
  logout: async ({ cookies }: { cookies: import("@sveltejs/kit").Cookies }) => {
    cookies.delete("better-auth.session_token", { path: "/" });
    redirect(302, "/");
  },
};
