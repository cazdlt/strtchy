import { db } from "$lib/db";
import {
  practiceLogs,
  practiceData,
  routineMovements,
  routines,
  movements,
  user,
} from "$lib/db/schema";
import { eq, desc, and, sql, isNotNull, ne } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { PageData, RequestEvent } from "./$types";
import { nanoid } from "nanoid";

// Helper to get previous workout stats for a movement
async function getPreviousStats(movementId: string, userId: string, currentPracticeId: string) {
  // Find the most recent practice log that has data for this movement (excluding the current practice)
  const lastPracticeData = await db
    .select({
      practiceLogId: practiceData.practiceLogId
    })
    .from(practiceData)
    .innerJoin(practiceLogs, eq(practiceData.practiceLogId, practiceLogs.id))
    .innerJoin(routineMovements, eq(practiceData.routineMovementId, routineMovements.id))
    .where(
      and(
        eq(practiceLogs.userId, userId),
        eq(routineMovements.movementId, movementId),
        ne(practiceLogs.id, currentPracticeId)
      )
    )
    .orderBy(desc(practiceData.completedAt))
    .limit(1);

  if (lastPracticeData.length === 0) return null;

  const practiceLogId = lastPracticeData[0].practiceLogId;

  // Now get all sets for that movement in that specific practice
  const stats = await db
    .select({
      id: practiceData.id,
      setNumber: practiceData.setNumber,
      side: practiceData.side,
      value: practiceData.value,
      weight: practiceData.weight,
      weightUnit: practiceData.weightUnit,
      rating: practiceData.rating,
      completedAt: practiceData.completedAt
    })
    .from(practiceData)
    .innerJoin(routineMovements, eq(practiceData.routineMovementId, routineMovements.id))
    .where(
      and(
        eq(practiceData.practiceLogId, practiceLogId),
        eq(routineMovements.movementId, movementId)
      )
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
  const practice = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, params.id),
    with: {
      routine: true,
      practiceData: {
        with: {
          routineMovement: {
            with: {
              movement: true,
            },
          },
        },
        orderBy: practiceData.completedAt,
      },
    },
  });

  if (!practice) {
    throw new Error("Practice not found");
  }

  // Check if practice is old (read-only)
  const isReadOnly = !!practice.completedAt;

  // Get user preferences
  let userPrefs = null;
  if (locals.user?.id) {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, locals.user.id),
      columns: {
        preferences: true,
      },
    });
    userPrefs = userData?.preferences;
  }

  // Get all routine movements
  const allRoutineMovements = await db.query.routineMovements.findMany({
    where: eq(routineMovements.routineId, practice.routineId),
    with: {
      movement: true,
    },
    orderBy: routineMovements.order,
  });

  // Fetch previous workout stats for each movement
  const previousStatsMap: Record<string, any> = {};
  if (locals.user?.id) {
    for (const rm of allRoutineMovements) {
      const prevStats = await getPreviousStats(rm.movementId, locals.user.id, params.id);
      if (prevStats) {
        previousStatsMap[rm.id] = prevStats;
      }
    }
  }

  // Calculate sets with overrides
  const overrides = practice.setOverrides || {};
  const totalSets = allRoutineMovements.reduce((sum, rm) => {
    const sets = overrides[rm.id] ?? rm.sets;
    return sum + (rm.isBilateral ? sets * 2 : sets);
  }, 0);
  const completedSetsCount = practice.practiceData.length;
  const progress = totalSets > 0 ? completedSetsCount / totalSets : 0;

  return {
    practice,
    allRoutineMovements,
    previousStatsMap,
    userPrefs,
    isReadOnly,
    progress,
    totalSets,
    completedSets: completedSetsCount,
    setOverrides: overrides,
  };
}

export const actions = {
  completePractice: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const notes = formData.get("notes") as string;

    // Update practice log
    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, params.id),
    });

    if (!practice) {
      return fail(404, { error: "Practice not found" });
    }

    // Calculate duration
    const completedAt = new Date();
    const duration = Math.floor(
      (completedAt.getTime() - practice.startedAt.getTime()) / 1000,
    );

    await db
      .update(practiceLogs)
      .set({
        completedAt,
        duration,
        notes: notes || null,
      })
      .where(eq(practiceLogs.id, params.id));

    redirect(302, `/practice/${params.id}/summary`);
  },

  completeSet: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const setNumber = parseInt(formData.get("setNumber") as string);
    const value = parseInt(formData.get("value") as string);
    const measurementType = formData.get("measurementType") as "time" | "reps";
    const customMeasurement = formData.get("customMeasurement") as string;
    const side = formData.get("side") as "left" | "right" | null;
    const weight = formData.get("weight");
    const weightUnit = formData.get("weightUnit") as
      | "lbs"
      | "kg"
      | "bodyweight"
      | null;
    const rating = formData.get("rating");

    if (!routineMovementId || !setNumber || !value) {
      return fail(400, { error: "Missing required fields" });
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
      completedAt: new Date(),
    });

    return { success: true };
  },

  submitRating: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const rating = parseInt(formData.get("rating") as string);

    if (!routineMovementId || isNaN(rating)) {
      return fail(400, { error: "Missing required fields" });
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
    const routineMovementId = formData.get("routineMovementId") as string;
    const notes = formData.get("notes") as string;

    if (!routineMovementId) {
      return fail(400, { error: "Missing routineMovementId" });
    }

    await db
      .update(routineMovements)
      .set({ notes: notes || null })
      .where(eq(routineMovements.id, routineMovementId));

    return { success: true };
  },

  updatePracticeSettings: async ({ request, locals }: RequestEvent) => {
    const formData = await request.formData();
    const autoPlay = formData.get("autoPlay") === "true";
    const audioEnabled = formData.get("audioEnabled") === "true";
    const keepAwake = formData.get("keepAwake") === "true";
    const practiceId = formData.get("practiceId") as string;

    if (!practiceId) {
      return fail(400, { error: "Missing practiceId" });
    }

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, practiceId),
      with: { routine: true },
    });

    if (!practice) {
      return fail(404, { error: "Practice not found" });
    }

    await db
      .update(routines)
      .set({
        autoAdvance: autoPlay,
        audioEnabled,
        keepAwake,
      })
      .where(eq(routines.id, practice.routineId));

    if (locals.user?.id) {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, locals.user.id),
        columns: { preferences: true },
      });

      const currentPrefs = userData?.preferences || {};
      await db
        .update(user)
        .set({
          preferences: {
            ...currentPrefs,
            autoAdvance: autoPlay,
            audioEnabled,
            keepAwake,
          },
        })
        .where(eq(user.id, locals.user.id));
    }

    return { success: true };
  },

  adjustSets: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const direction = formData.get("direction") as "up" | "down";

    if (!routineMovementId || !direction) {
      return fail(400, { error: "Missing required fields" });
    }

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, params.id),
    });

    if (!practice) {
      return fail(404, { error: "Practice not found" });
    }

    const overrides = practice.setOverrides || {};

    // Find current base sets
    const rm = await db.query.routineMovements.findFirst({
      where: eq(routineMovements.id, routineMovementId),
    });

    if (!rm) return fail(404, { error: "Movement not found" });

    const currentSets = overrides[routineMovementId] ?? rm.sets;

    if (direction === "down") {
      // Check if we have more completed sets than the new total
      const completed = await db.query.practiceData.findMany({
        where: and(
          eq(practiceData.practiceLogId, params.id),
          eq(practiceData.routineMovementId, routineMovementId),
        ),
      });

      // If bilateral, completed count is sides, but sets is pairs
      const completedSetNumbers = new Set(completed.map((pd) => pd.setNumber));
      const maxCompletedSet =
        completedSetNumbers.size > 0 ? Math.max(...completedSetNumbers) : 0;

      if (currentSets <= 1 || maxCompletedSet >= currentSets) {
        return fail(400, {
          error:
            "Cannot remove a set that is already completed or if only 1 remains",
        });
      }
    }

    const newSets = direction === "up" ? currentSets + 1 : currentSets - 1;

    await db
      .update(practiceLogs)
      .set({
        setOverrides: {
          ...overrides,
          [routineMovementId]: newSets,
        },
      })
      .where(eq(practiceLogs.id, params.id));

    return { success: true, newSets };
  },
};
