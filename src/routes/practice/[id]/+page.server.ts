import { db } from "$lib/db";
import {
  practiceLogs,
  practiceData,
  routineMovements,
  routines,
  movements,
  user,
} from "$lib/db/schema";
import { eq, desc, and, sql, isNull, ne } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { PageServerLoad, RequestEvent } from "./$types";
import { nanoid } from "nanoid";

export const load: PageServerLoad = async ({ params, locals, depends }) => {
  depends("app:practice");

  const practice = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, params.id),
    with: {
      routine: true,
    },
  });

  if (!practice) {
    throw new Error("Practice not found");
  }

  const isReadOnly = !!practice.completedAt;

  // User preferences
  let userPrefs = null;
  if (locals.user?.id) {
    const userData = await db.query.user.findFirst({
      where: eq(user.id, locals.user.id),
      columns: { preferences: true },
    });
    userPrefs = userData?.preferences;
  }

  // All routine movements
  const allRoutineMovements = await db.query.routineMovements.findMany({
    where: eq(routineMovements.routineId, practice.routineId),
    with: {
      movement: true,
    },
    orderBy: routineMovements.order,
  });

  // Existing practice data (for resuming)
  const existingPracticeData = isReadOnly
    ? await db.query.practiceData.findMany({
        where: eq(practiceData.practiceLogId, params.id),
        orderBy: [practiceData.order, practiceData.setNumber],
      })
    : [];

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

  // Equipment
  const allEquipment = new Set<string>();
  for (const rm of allRoutineMovements) {
    if (rm.movement.equipment && Array.isArray(rm.movement.equipment)) {
      for (const item of rm.movement.equipment) allEquipment.add(item);
    }
  }

  return {
    practice,
    allRoutineMovements,
    existingPracticeData,
    userPrefs,
    isReadOnly,
    groupedMovements,
    equipment: Array.from(allEquipment).sort(),
  };
};

export const actions = {
  completePractice: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const notes = formData.get("notes") as string;
    const dataJson = formData.get("practiceData") as string;
    const durationStr = formData.get("duration") as string;

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, params.id),
    });
    if (!practice) return fail(404, { error: "Practice not found" });

    const duration = durationStr != null && durationStr !== ''
      ? parseInt(durationStr)
      : Math.floor((Date.now() - practice.startedAt.getTime()) / 1000);
    const completedAt = new Date();

    // Update practice log
    await db.update(practiceLogs).set({
      completedAt,
      duration,
      notes: notes || null,
    }).where(eq(practiceLogs.id, params.id));

    // Batch insert all practice data
    if (dataJson) {
      const rows = JSON.parse(dataJson) as Array<{
        movementId: string;
        movementName: string;
        movementType: string;
        targetType: string;
        targetValue: number;
        order: number;
        setNumber: number;
        side: string | null;
        value: number;
        weight: number | null;
        weightUnit: string | null;
        rating: number | null;
        status: "completed" | "skipped";
      }>;

      if (rows.length > 0) {
        await db.insert(practiceData).values(
          rows.map((r) => ({
            id: nanoid(),
            practiceLogId: params.id,
            movementId: r.movementId,
            movementName: r.movementName,
            movementType: r.movementType as "timed" | "reps" | "weighted" | "resistance_band",
            targetType: r.targetType as "reps" | "time",
            targetValue: r.targetValue,
            order: r.order,
            setNumber: r.setNumber,
            side: r.side as "left" | "right" | null,
            value: r.value,
            weight: r.weight,
            weightUnit: r.weightUnit as "lbs" | "kg" | "bodyweight" | null,
            rating: r.rating,
            status: r.status,
            completedAt,
          })),
        );
      }
    }

    redirect(302, `/practice/${params.id}/summary`);
  },

  updatePracticeSettings: async ({ request, locals }: RequestEvent) => {
    const formData = await request.formData();
    const autoPlay = formData.get("autoPlay") === "true";
    const audioEnabled = formData.get("audioEnabled") === "true";
    const keepAwake = formData.get("keepAwake") === "true";
    const practiceId = formData.get("practiceId") as string;

    if (!practiceId) return fail(400, { error: "Missing practiceId" });

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, practiceId),
      with: { routine: true },
    });
    if (!practice) return fail(404, { error: "Practice not found" });

    await db.update(routines).set({
      autoAdvance: autoPlay,
      audioEnabled,
      keepAwake,
    }).where(eq(routines.id, practice.routineId));

    if (locals.user?.id) {
      const userData = await db.query.user.findFirst({
        where: eq(user.id, locals.user.id),
        columns: { preferences: true },
      });
      await db.update(user).set({
        preferences: {
          ...(userData?.preferences || {}),
          autoAdvance: autoPlay,
          audioEnabled,
          keepAwake,
        },
      }).where(eq(user.id, locals.user.id));
    }

    return { success: true };
  },

  updateMovementNotes: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const notes = formData.get("notes") as string;

    if (!routineMovementId) return fail(400, { error: "Missing routineMovementId" });

    await db.update(routineMovements)
      .set({ notes: notes || null })
      .where(eq(routineMovements.id, routineMovementId));

    return { success: true };
  },

  addMovement: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const movementId = formData.get("movementId") as string;

    if (!movementId) return fail(400, { error: "Missing movementId" });

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, params.id),
    });
    if (!practice) return fail(404, { error: "Practice not found" });

    const movement = await db.query.movements.findFirst({
      where: eq(movements.id, movementId),
    });
    if (!movement) return fail(404, { error: "Movement not found" });

    const existing = await db.query.routineMovements.findMany({
      where: eq(routineMovements.routineId, practice.routineId),
      orderBy: routineMovements.order,
    });

    const maxOrder = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) : -1;

    const targetTypeMap = {
      timed: "time" as const,
      reps: "reps" as const,
      weighted: "reps" as const,
      resistance_band: "reps" as const,
    };

    const defaultTarget = movement.metadata?.defaultTarget;

    const newId = nanoid();
    await db.insert(routineMovements).values({
      id: newId,
      routineId: practice.routineId,
      movementId: movement.id,
      order: maxOrder + 1,
      target: {
        type: targetTypeMap[movement.type as keyof typeof targetTypeMap],
        value: defaultTarget?.value || 30,
        unit: defaultTarget?.unit,
      },
      sets: 1,
      isBilateral: movement.isBilateral ?? false,
      switchSidesDuration: movement.switchSidesDuration ?? 5,
      weight: null,
      weightUnit: movement.weightUnit || null,
      notes: null,
    });

    const newRow = await db.query.routineMovements.findFirst({
      where: eq(routineMovements.id, newId),
      with: { movement: true },
    });

    return { success: true, routineMovement: newRow };
  },

  removeMovement: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;

    if (!routineMovementId) return fail(400, { error: "Missing routineMovementId" });

    // With new schema, no need to delete practiceData (no FK to routineMovements)
    await db.delete(routineMovements)
      .where(eq(routineMovements.id, routineMovementId));

    return { success: true };
  },

  reorderMovement: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const direction = formData.get("direction") as "up" | "down";

    if (!routineMovementId || !direction) return fail(400, { error: "Missing required fields" });

    const rm = await db.query.routineMovements.findFirst({
      where: eq(routineMovements.id, routineMovementId),
    });
    if (!rm) return fail(404, { error: "Movement not found" });

    const all = await db.query.routineMovements.findMany({
      where: eq(routineMovements.routineId, rm.routineId),
      orderBy: routineMovements.order,
    });

    const currentIndex = all.findIndex((m) => m.id === routineMovementId);
    if (currentIndex === -1) return fail(404, { error: "Movement not found" });

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= all.length) return fail(400, { error: "Cannot move in this direction" });

    const currentOrder = all[currentIndex].order;
    const targetOrder = all[newIndex].order;

    await db.update(routineMovements).set({ order: targetOrder })
      .where(eq(routineMovements.id, routineMovementId));
    await db.update(routineMovements).set({ order: currentOrder })
      .where(eq(routineMovements.id, all[newIndex].id));

    return { success: true };
  },

  adjustSets: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const routineMovementId = formData.get("routineMovementId") as string;
    const direction = formData.get("direction") as "up" | "down";

    if (!routineMovementId || !direction) return fail(400, { error: "Missing required fields" });

    const rm = await db.query.routineMovements.findFirst({
      where: eq(routineMovements.id, routineMovementId),
    });
    if (!rm) return fail(404, { error: "Movement not found" });

    const currentSets = rm.sets;
    if (direction === "down" && currentSets <= 1) {
      return fail(400, { error: "Cannot go below 1 set" });
    }

    const newSets = direction === "up" ? currentSets + 1 : currentSets - 1;

    await db.update(routineMovements).set({ sets: newSets })
      .where(eq(routineMovements.id, routineMovementId));

    return { success: true, newSets };
  },

  saveRoutineChanges: async ({ request, params }: RequestEvent) => {
    const formData = await request.formData();
    const movementsJson = formData.get("movements") as string;

    if (!movementsJson) return fail(400, { error: "Missing movements data" });

    const practice = await db.query.practiceLogs.findFirst({
      where: eq(practiceLogs.id, params.id),
    });
    if (!practice) return fail(404, { error: "Practice not found" });

    const movementsData = JSON.parse(movementsJson) as Array<{
      id: string;
      movementId: string;
      target: { type: "time" | "reps"; value: number; unit?: string };
      sets: number;
      isBilateral: boolean;
      switchSidesDuration: number;
      weight?: number | null;
      weightUnit?: string | null;
      notes?: string | null;
    }>;

    // Delete all existing routine movements and re-insert
    await db.delete(routineMovements)
      .where(eq(routineMovements.routineId, practice.routineId));

    for (let i = 0; i < movementsData.length; i++) {
      const m = movementsData[i];
      await db.insert(routineMovements).values({
        id: m.id,
        routineId: practice.routineId,
        movementId: m.movementId,
        order: i,
        target: m.target,
        sets: m.sets,
        isBilateral: m.isBilateral,
        switchSidesDuration: m.switchSidesDuration,
        weight: m.weight ?? null,
        weightUnit: m.weightUnit as "lbs" | "kg" | "bodyweight" | null,
        notes: m.notes ?? null,
      });
    }

    return { success: true };
  },
};
