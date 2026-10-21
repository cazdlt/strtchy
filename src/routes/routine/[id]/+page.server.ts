import { db } from "$lib/db";
import {
  routines,
  routineMovements,
  practiceLogs,
  practiceData,
  movements,
} from "$lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import type { PageData, ActionsFailure, RequestEvent } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { nanoid } from "nanoid";
import { calculateRoutineDuration } from "$lib/utils/formatting";

// Helper to get previous workout stats for a movement
async function getPreviousStats(
  movementId: string,
  userId: string | null | undefined,
) {
  // Find the most recent practice log that has data for this movement
  const lastPracticeData = await db
    .select({
      practiceLogId: practiceData.practiceLogId,
    })
    .from(practiceData)
    .innerJoin(practiceLogs, eq(practiceData.practiceLogId, practiceLogs.id))
    .where(
      and(
        userId ? eq(practiceLogs.userId, userId) : isNull(practiceLogs.userId),
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
    throw new Error("Routine not found");
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

  // All movements for add modal
  const allMovements = await db.select().from(movements).orderBy(movements.name);

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
      userId: locals.user?.id,
      startedAt: now,
      notes,
    });

    redirect(302, `/practice/${practiceLogId}`);
  },

  deleteRoutine: async ({ params, locals }: RequestEvent) => {
    // Check if user is authenticated and owns the routine
    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, params.id),
    });

    if (!routine) {
      return fail(404, { error: "Routine not found" });
    }

    if (!locals.user || locals.user.id !== routine.userId) {
      return fail(403, { error: "Not authorized to delete this routine" });
    }

    // Delete the routine (cascade will handle routine_movements)
    await db.delete(routines).where(eq(routines.id, params.id));

    redirect(302, "/routines");
  },
};
