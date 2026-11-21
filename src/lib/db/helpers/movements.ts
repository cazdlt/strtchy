import { db } from "$lib/db";
import { movements } from "$lib/db/schema";
import { eq, and, or, asc } from "drizzle-orm";
import type {
  MovementInput,
  MovementUpdateInput,
} from "$lib/validation/schemas/movement";
import { checkDuplicateMovementName } from "$lib/validation/helpers/duplicates";
import { handleIllustrationUpload, deleteIllustration } from "./files";
import { getTargetTypeMap } from "$lib/validation/helpers/parsers";
import { generateMovementId } from "$lib/utils/id";
import { ForbiddenError } from "./routines";

export { ForbiddenError };

function requireValidUserId(userId: string | undefined): string {
  if (!userId) {
    throw new ForbiddenError("Forbidden: valid userId is required");
  }
  return userId;
}

export async function listMovements(userId?: string) {
  const whereClause = userId
    ? or(eq(movements.isCustom, false), eq(movements.userId, userId))
    : eq(movements.isCustom, false);

  return db.query.movements.findMany({
    where: whereClause,
    orderBy: [asc(movements.name)],
  });
}

export async function getMovementById(movementId: string, userId?: string) {
  const movement = await db.query.movements.findFirst({
    where: eq(movements.id, movementId),
  });

  if (!movement) {
    return null;
  }

  if (movement.isCustom && (!userId || movement.userId !== userId)) {
    throw new ForbiddenError("Forbidden: you do not have access to this movement");
  }

  return movement;
}

export async function createMovement(
  data: MovementInput,
  userId: string,
  illustrationFile?: File,
) {
  const validUserId = requireValidUserId(userId);

  // Check for duplicate name
  const duplicate = await checkDuplicateMovementName(data.name);
  if (duplicate.exists) {
    throw new Error(`Movement "${duplicate.existingName}" already exists`);
  }

  // Handle illustration upload
  let illustrationPath: string | null = null;
  if (illustrationFile && illustrationFile.size > 0) {
    illustrationPath = await handleIllustrationUpload(illustrationFile);
  }

  // Build metadata with default target
  const targetTypeMap = getTargetTypeMap();
  const metadata = {
    defaultTarget: {
      type: targetTypeMap[data.type],
      value: data.defaultValue,
      unit: undefined,
    },
  };

  const movementId = generateMovementId(data.name);

  await db.insert(movements).values({
    id: movementId,
    name: data.name,
    description: data.description,
    type: data.type,
    illustrationPath,
    isCustom: true,
    userId: validUserId,
    weightUnit:
      (data.type === "weighted" || data.type === "resistance_band") &&
      data.defaultUnit
        ? data.defaultUnit
        : null,
    isBilateral: data.isBilateral,
    switchSidesDuration: data.switchSidesDuration,
    timePerRep:
      data.type !== "timed" && data.timePerRep ? data.timePerRep : null,
    equipment: data.equipment,
    metadata,
    createdAt: new Date(),
  });

  return movementId;
}

export async function updateMovement(
  movementId: string,
  data: MovementUpdateInput,
  userId: string,
  illustrationFile?: File,
  removeIllustration: boolean = false,
) {
  const validUserId = requireValidUserId(userId);

  const existing = await db.query.movements.findFirst({
    where: eq(movements.id, movementId),
  });

  if (!existing) {
    throw new Error("Movement not found");
  }

  if (!existing.isCustom) {
    throw new ForbiddenError("Forbidden: cannot modify built-in movement");
  }

  if (existing.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this movement");
  }

  // Check for duplicate name if changing name
  if (data.name && data.name !== existing.name) {
    const duplicate = await checkDuplicateMovementName(data.name, movementId);
    if (duplicate.exists) {
      throw new Error(`Movement "${duplicate.existingName}" already exists`);
    }
  }

  // Handle illustration
  let illustrationPath = existing.illustrationPath;

  if (removeIllustration && illustrationPath) {
    await deleteIllustration(illustrationPath);
    illustrationPath = null;
  }

  if (illustrationFile && illustrationFile.size > 0) {
    if (illustrationPath) {
      await deleteIllustration(illustrationPath);
    }
    illustrationPath = await handleIllustrationUpload(illustrationFile);
  }

  // Build metadata
  const targetTypeMap = getTargetTypeMap();
  const type = data.type || existing.type;
  const metadata = {
    defaultTarget: {
      type: targetTypeMap[type],
      value: data.defaultValue ?? existing.metadata?.defaultTarget?.value ?? 0,
      unit: undefined,
    },
  };

  await db
    .update(movements)
    .set({
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      type: data.type ?? existing.type,
      illustrationPath,
      weightUnit:
        (type === "weighted" || type === "resistance_band") && data.defaultUnit
          ? data.defaultUnit
          : existing.weightUnit,
      isBilateral: data.isBilateral ?? existing.isBilateral,
      switchSidesDuration:
        data.switchSidesDuration ?? existing.switchSidesDuration,
      timePerRep:
        type !== "timed" && data.timePerRep !== undefined
          ? data.timePerRep
          : existing.timePerRep,
      equipment: data.equipment ?? existing.equipment,
      metadata,
    })
    .where(and(eq(movements.id, movementId), eq(movements.userId, validUserId)));

  return movementId;
}

export async function deleteMovement(movementId: string, userId: string) {
  const validUserId = requireValidUserId(userId);

  const existing = await db.query.movements.findFirst({
    where: eq(movements.id, movementId),
  });

  if (!existing) {
    throw new Error("Movement not found");
  }

  if (!existing.isCustom) {
    throw new ForbiddenError("Forbidden: cannot delete built-in movement");
  }

  if (existing.userId !== validUserId) {
    throw new ForbiddenError("Forbidden: you do not own this movement");
  }

  // Delete illustration if exists
  if (existing.illustrationPath) {
    await deleteIllustration(existing.illustrationPath);
  }

  await db
    .delete(movements)
    .where(and(eq(movements.id, movementId), eq(movements.userId, validUserId)));
}
