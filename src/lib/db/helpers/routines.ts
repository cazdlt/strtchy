import { db } from "$lib/db";
import {
  routines,
  routineMovements,
  movements,
} from "$lib/db/schema";
import { eq, and, or, asc, desc } from "drizzle-orm";
import { checkDuplicateRoutineName } from "$lib/validation/helpers/duplicates";
import { generateRoutineId, generateRoutineMovementId } from "$lib/utils/id";
import type {
  RoutineInput,
  RoutineUpdateInput,
  RoutineMovementConfig,
} from "$lib/validation/schemas/routine";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

function requireValidUserId(userId: string | undefined): string {
  if (!userId) {
    throw new ForbiddenError("Forbidden: valid userId is required");
  }
  return userId;
}

export async function listRoutines(userId?: string) {
  const whereClause = userId
    ? or(eq(routines.isCustom, false), eq(routines.userId, userId))
    : eq(routines.isCustom, false);

  return db.query.routines.findMany({
    where: whereClause,
    with: {
      movements: {
        with: { movement: true },
        orderBy: asc(routineMovements.order),
      },
    },
    orderBy: [desc(routines.createdAt)],
  });
}

export async function getRoutineById(routineId: string, userId?: string) {
  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
    with: {
      movements: {
        with: { movement: true },
        orderBy: asc(routineMovements.order),
      },
    },
  });

  if (!routine) {
    return null;
  }

  if (routine.isCustom && (!userId || routine.userId !== userId)) {
    throw new ForbiddenError("Forbidden: you do not have access to this routine");
  }

  return routine;
}

export async function createRoutine(
  data: RoutineInput,
  userId: string | undefined,
) {
  const validUserId = requireValidUserId(userId);

  // Check for duplicate name
  const duplicate = await checkDuplicateRoutineName(data.name);
  if (duplicate.exists) {
    throw new Error(`Routine "${duplicate.existingName}" already exists`);
  }

  const routineId = generateRoutineId(data.name);

  await db.insert(routines).values({
    id: routineId,
    name: data.name,
    description: data.description,
    userId: validUserId,
    restBetweenMovements: data.restBetweenMovements,
    restBetweenSets: data.restBetweenSets,
    autoAdvance: data.autoAdvance,
    audioEnabled: data.audioEnabled,
    keepAwake: data.keepAwake,
    isCustom: true,
    createdAt: new Date(),
  });

  // Insert routine movements
  await insertRoutineMovements(
    routineId,
    data.name,
    data.movementsData as RoutineMovementConfig[],
    validUserId,
  );

  return routineId;
}

export async function updateRoutine(
  routineId: string,
  data: RoutineUpdateInput,
  movementsData: RoutineMovementConfig[] | undefined,
  userId: string | undefined,
) {
  const validUserId = requireValidUserId(userId);

  const existing = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
  });

  if (!existing) {
    throw new Error("Routine not found");
  }

  if (!existing.isCustom) {
    throw new ForbiddenError("Forbidden: cannot modify built-in routine");
  }

  if (existing.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this routine");
  }

  // Check for duplicate name if changing
  if (data.name && data.name !== existing.name) {
    const duplicate = await checkDuplicateRoutineName(data.name, routineId);
    if (duplicate.exists) {
      throw new Error(`Routine "${duplicate.existingName}" already exists`);
    }
  }

  // Update routine
  await db
    .update(routines)
    .set({
      name: data.name ?? existing.name,
      description:
        data.description !== undefined
          ? data.description
          : existing.description,
      restBetweenMovements:
        data.restBetweenMovements ?? existing.restBetweenMovements,
      restBetweenSets: data.restBetweenSets ?? existing.restBetweenSets,
      autoAdvance: data.autoAdvance ?? existing.autoAdvance,
      audioEnabled: data.audioEnabled ?? existing.audioEnabled,
      keepAwake: data.keepAwake ?? existing.keepAwake,
    })
    .where(and(eq(routines.id, routineId), eq(routines.userId, validUserId)));

  // Delete and re-insert movements only if movementsData was provided
  if (movementsData !== undefined) {
    console.log(
      `[updateRoutine] Deleting old movements for routine ${routineId}`,
    );
    await db
      .delete(routineMovements)
      .where(eq(routineMovements.routineId, routineId));

    console.log(
      `[updateRoutine] Inserting ${movementsData.length} new movements for routine ${routineId}`,
    );
    await insertRoutineMovements(
      routineId,
      data.name ?? existing.name,
      movementsData,
      validUserId,
    );
  }
  console.log(`[updateRoutine] Successfully updated routine ${routineId}`);

  return routineId;
}

export async function deleteRoutine(
  routineId: string,
  userId: string | undefined,
) {
  const validUserId = requireValidUserId(userId);

  const existing = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
  });

  if (!existing) {
    throw new Error("Routine not found");
  }

  if (!existing.isCustom) {
    throw new ForbiddenError("Forbidden: cannot delete built-in routine");
  }

  if (existing.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this routine");
  }

  await db
    .delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, validUserId)));
}

export async function insertRoutineMovements(
  routineId: string,
  routineName: string,
  movementsData: RoutineMovementConfig[],
  userId?: string,
) {
  for (let i = 0; i < movementsData.length; i++) {
    const movement = movementsData[i];

    const movementRecord = await db.query.movements.findFirst({
      where: eq(movements.id, movement.movementId),
    });

    if (
      movementRecord &&
      userId &&
      movementRecord.isCustom &&
      movementRecord.userId !== userId
    ) {
      throw new ForbiddenError(
        "Forbidden: you do not have access to this movement",
      );
    }

    const movementName = movementRecord?.name || "unknown";
    const id = generateRoutineMovementId(routineName, movementName, i);

    await db.insert(routineMovements).values({
      id,
      routineId,
      movementId: movement.movementId,
      order: movement.order,
      target: movement.target,
      sets: movement.sets,
      isBilateral: movement.isBilateral,
      switchSidesDuration: movement.switchSidesDuration,
      weight: movement.weight,
      weightUnit: movement.weightUnit,
      notes: movement.notes,
    });
  }
}

export async function updateRoutineMovement(
  routineId: string,
  routineMovementId: string,
  data: Partial<RoutineMovementConfig>,
  userId?: string,
) {
  const validUserId = requireValidUserId(userId);

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
  });

  if (!routine) {
    throw new Error("Routine not found");
  }

  if (!routine.isCustom) {
    throw new ForbiddenError("Forbidden: cannot modify built-in routine");
  }

  if (routine.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this routine");
  }

  const existing = await db.query.routineMovements.findFirst({
    where: eq(routineMovements.id, routineMovementId),
  });

  if (!existing || existing.routineId !== routineId) {
    throw new Error("Routine movement not found");
  }

  await db
    .update(routineMovements)
    .set({
      order: data.order ?? existing.order,
      target: data.target ?? existing.target,
      sets: data.sets ?? existing.sets,
      isBilateral: data.isBilateral ?? existing.isBilateral,
      switchSidesDuration:
        data.switchSidesDuration ?? existing.switchSidesDuration,
      weight: data.weight !== undefined ? data.weight : existing.weight,
      weightUnit: data.weightUnit ?? existing.weightUnit,
      notes: data.notes !== undefined ? data.notes : existing.notes,
    })
    .where(eq(routineMovements.id, routineMovementId));

  return routineMovementId;
}

export async function deleteRoutineMovement(
  routineId: string,
  routineMovementId: string,
  userId?: string,
) {
  const validUserId = requireValidUserId(userId);

  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, routineId),
  });

  if (!routine) {
    throw new Error("Routine not found");
  }

  if (!routine.isCustom) {
    throw new ForbiddenError("Forbidden: cannot modify built-in routine");
  }

  if (routine.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this routine");
  }

  const existing = await db.query.routineMovements.findFirst({
    where: eq(routineMovements.id, routineMovementId),
  });

  if (!existing || existing.routineId !== routineId) {
    throw new Error("Routine movement not found");
  }

  await db
    .delete(routineMovements)
    .where(eq(routineMovements.id, routineMovementId));
}
