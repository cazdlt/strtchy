import { db } from "$lib/db";
import {
  routines,
  routineMovements,
  practiceLogs,
  practiceData,
  movements,
} from "$lib/db/schema";
import { eq, desc, and, or } from "drizzle-orm";
import type { PageData, ActionsFailure, RequestEvent } from "./$types";
import { fail, redirect, error } from "@sveltejs/kit";
import { nanoid } from "nanoid";
import { calculateRoutineDuration } from "$lib/utils/formatting";
import { deleteRoutine, ForbiddenError } from "$lib/db/helpers/routines";

// Helper to get previous workout stats for a movement
async function getPreviousStats(
  movementId: string,
  userId: string | null | undefined,
) {
  if (!userId) return null;

  // Find the most recent practice log that has data for this movement
  const lastPracticeData = await db
    .select({
      practiceLogId: practiceData.practiceLogId,
    })
    .from(practiceData)
    .innerJoin(practiceLogs, eq(practiceData.practiceLogId, practiceLogs.id))
    .where(
      and(
        eq(practiceLogs.userId, userId),
        eq(practiceData.movementId, movementId),
      ),
    )
    .orderBy(desc(practiceData.completedAt))
    .limit(1);

  if (lastPracticeData.length === 0) return null;

  const practiceLogId = lastPracticeData[0].practiceLogId;

  // Get all sets for that movement in that specific practice
  const stats = await db
    .select({
      id: practiceData.id,
      setNumber: practiceData.setNumber,
      side: practiceData.side,
      value: practiceData.value,
      weight: practiceData.weight,
      weightUnit: practiceData.weightUnit,
      rating: practiceData.rating,
      completedAt: practiceData.completedAt,
    })
    .from(practiceData)
    .where(
      and(
        eq(practiceData.practiceLogId, practiceLogId),
        eq(practiceData.movementId, movementId),
      ),
    );

  return stats;
}

export async function load({
  params,
  locals,
}: {
  params: { id: string };
  locals: App.Locals;
}) {
  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, params.id),
    with: {
      movements: {
        with: {
          movement: true,
        },
        orderBy: routineMovements.order,
      },
    },
  });

  if (!routine) {
    throw error(404, "Routine not found");
  }

  if (routine.isCustom && (!locals.user || routine.userId !== locals.user.id)) {
    throw error(404, "Routine not found");
  }

  const estimatedDuration = calculateRoutineDuration(
    routine.movements.map((rm) => ({
      target: rm.target,
      sets: rm.sets,
      isBilateral: rm.isBilateral,
      switchSidesDuration: rm.switchSidesDuration,
      timePerRep: rm.movement.timePerRep,
    })),
    routine.restBetweenMovements,
    routine.restBetweenSets,
  );

  const allEquipment = new Set<string>();
  for (const rm of routine.movements) {
    if (rm.movement.equipment && Array.isArray(rm.movement.equipment)) {
      for (const item of rm.movement.equipment) {
        allEquipment.add(item);
      }
    }
  }

  // Fetch previous workout stats for each movement
  const previousStatsMap: Record<string, any> = {};
  for (const rm of routine.movements) {
    const prevStats = await getPreviousStats(rm.movementId, locals.user?.id);
    if (prevStats) {
      previousStatsMap[rm.id] = prevStats;
    }
  }

  const movementWhere = locals.user
    ? or(eq(movements.isCustom, false), eq(movements.userId, locals.user.id))
    : eq(movements.isCustom, false);

  // All movements for add modal (built-in or user's own)
  const allMovements = await db
    .select()
    .from(movements)
    .where(movementWhere)
    .orderBy(movements.name);

  // Group by type for add modal
  const groupedMovements: Record<string, typeof allMovements> = {
    Timed: [],
    Repetitions: [],
    Weighted: [],
    "Resistance Band": [],
  };
  for (const movement of allMovements) {
    if (movement.type === "timed") groupedMovements.Timed.push(movement);
    else if (movement.type === "reps") groupedMovements.Repetitions.push(movement);
    else if (movement.type === "weighted") groupedMovements.Weighted.push(movement);
    else if (movement.type === "resistance_band") groupedMovements["Resistance Band"].push(movement);
  }

  return {
    routine,
    user: locals.user,
    estimatedDuration,
    equipment: Array.from(allEquipment).sort(),
    previousStatsMap,
    allMovements,
    groupedMovements,
  };
}

export const actions = {
  startPractice: async ({ request, params, locals }: RequestEvent) => {
    if (!locals.user) {
      throw redirect(302, `/login?redirectTo=/routine/${params.id}`);
    }

    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, params.id),
    });

    if (!routine || (routine.isCustom && routine.userId !== locals.user.id)) {
      throw error(404, "Routine not found");
    }

    const formData = await request.formData();
    const customMovementsStr = formData.get("customMovements") as string | null;

    // Create a new practice log
    const practiceLogId = nanoid();
    const now = new Date();

    let notes: string | null = null;
    if (customMovementsStr) {
      try {
        const parsed = JSON.parse(customMovementsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          notes = JSON.stringify({ transientMovements: parsed });
        }
      } catch (e) {
        console.error("Failed to parse customMovements in startPractice:", e);
      }
    }

    await db.insert(practiceLogs).values({
      id: practiceLogId,
      routineId: params.id,
      userId: locals.user.id,
      startedAt: now,
      notes,
    });

    redirect(302, `/practice/${practiceLogId}`);
  },

  deleteRoutine: async ({ params, locals }: RequestEvent) => {
    if (!locals.user) {
      return fail(401, { error: "Not authorized" });
    }

    try {
      await deleteRoutine(params.id, locals.user.id);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return fail(403, { error: err.message });
      }
      if (err instanceof Error && err.message.includes("not found")) {
        return fail(404, { error: "Routine not found" });
      }
      return fail(500, { error: "Failed to delete routine" });
    }

    redirect(302, "/routines");
  },
};
