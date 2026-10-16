import { db } from "$lib/db";
import {
  practiceLogs,
  practiceData,
  routines,
  routineMovements,
  movements,
} from "$lib/db/schema";
import { eq, desc, asc, and, gte, lte, isNotNull, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { calculateRoutineDuration, formatDuration } from "$lib/utils/formatting";
import { getTargetTypeMap } from "$lib/validation/helpers/parsers";
import type {
  PracticeCreateInput,
  PracticeUpdateInput,
  PracticeDataEntryInput,
} from "$lib/validation/schemas/practice";

export interface ListPracticesOptions {
  limit?: number;
  offset?: number;
  routineId?: string;
  completedOnly?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

export async function listPractices(options: ListPracticesOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const conditions = [];
  if (options.routineId) {
    conditions.push(eq(practiceLogs.routineId, options.routineId));
  }
  if (options.completedOnly) {
    conditions.push(isNotNull(practiceLogs.completedAt));
  }
  if (options.fromDate) {
    conditions.push(gte(practiceLogs.startedAt, options.fromDate));
  }
  if (options.toDate) {
    conditions.push(lte(practiceLogs.startedAt, options.toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ total: count() })
    .from(practiceLogs)
    .where(whereClause);

  const rows = await db
    .select({
      id: practiceLogs.id,
      routineId: practiceLogs.routineId,
      routineName: routines.name,
      userId: practiceLogs.userId,
      startedAt: practiceLogs.startedAt,
      completedAt: practiceLogs.completedAt,
      duration: practiceLogs.duration,
      notes: practiceLogs.notes,
      setsCount: sql<number>`count(${practiceData.id})`.as("sets_count"),
    })
    .from(practiceLogs)
    .leftJoin(routines, eq(practiceLogs.routineId, routines.id))
    .leftJoin(practiceData, eq(practiceLogs.id, practiceData.practiceLogId))
    .where(whereClause)
    .groupBy(practiceLogs.id)
    .orderBy(desc(practiceLogs.startedAt))
    .limit(limit)
    .offset(offset);

  return {
    practices: rows.map((r) => ({
      ...r,
      durationFormatted: r.duration != null ? formatDuration(r.duration) : null,
      isCompleted: r.completedAt != null,
    })),
    pagination: {
      total: countResult?.total ?? 0,
      limit,
      offset,
    },
  };
}

export async function getPracticeById(practiceId: string) {
  const practice = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, practiceId),
    with: {
      routine: true,
    },
  });

  if (!practice) {
    return null;
  }

  const sets = await db.query.practiceData.findMany({
    where: eq(practiceData.practiceLogId, practiceId),
    orderBy: [
      asc(practiceData.order),
      asc(practiceData.setNumber),
      asc(practiceData.side),
    ],
  });

  return {
    ...practice,
    durationFormatted:
      practice.duration != null ? formatDuration(practice.duration) : null,
    isCompleted: practice.completedAt != null,
    practiceData: sets,
  };
}

export async function createPractice(
  input: PracticeCreateInput,
  userId?: string,
) {
  const routine = await db.query.routines.findFirst({
    where: eq(routines.id, input.routineId),
    with: {
      movements: {
        with: { movement: true },
        orderBy: asc(routineMovements.order),
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

  // Determine timestamps and duration
  const completedAt =
    input.completedAt === null ? null : (input.completedAt ?? new Date());

  let duration = input.duration ?? null;
  if (duration === null && completedAt) {
    if (input.startedAt) {
      duration = Math.max(
        0,
        Math.floor((completedAt.getTime() - input.startedAt.getTime()) / 1000),
      );
    } else {
      duration = estimatedDuration;
    }
  }

  const startedAt =
    input.startedAt ??
    (completedAt && duration != null
      ? new Date(completedAt.getTime() - duration * 1000)
      : new Date());

  const practiceLogId = nanoid();

  await db.insert(practiceLogs).values({
    id: practiceLogId,
    routineId: routine.id,
    userId,
    startedAt,
    completedAt,
    duration,
    notes: input.notes ?? null,
  });

  const dataCompletedAt = completedAt ?? new Date();

  if (input.practiceData && input.practiceData.length > 0) {
    await insertPracticeDataEntries(
      practiceLogId,
      input.practiceData,
      dataCompletedAt,
      input.rating ?? null,
    );
  } else if (input.autoPopulateFromRoutine && completedAt !== null) {
    // Auto-populate sets from the routine's configured movements
    const rowsToInsert: Array<typeof practiceData.$inferInsert> = [];

    for (let i = 0; i < routine.movements.length; i++) {
      const rm = routine.movements[i];
      const sides: Array<"left" | "right" | null> = rm.isBilateral
        ? ["left", "right"]
        : [null];

      for (let setNum = 1; setNum <= rm.sets; setNum++) {
        for (const side of sides) {
          rowsToInsert.push({
            id: nanoid(),
            practiceLogId,
            movementId: rm.movementId,
            movementName: rm.movement.name,
            movementType: rm.movement.type,
            targetType: rm.target.type,
            targetValue: rm.target.value,
            order: rm.order ?? i,
            setNumber: setNum,
            side,
            value: rm.target.value,
            weight: rm.weight ?? null,
            weightUnit: rm.weightUnit ?? rm.movement.weightUnit ?? null,
            customMeasurement: rm.target.customTag ?? null,
            rating: input.rating ?? null,
            status: "completed",
            completedAt: dataCompletedAt,
          });
        }
      }
    }

    if (rowsToInsert.length > 0) {
      await db.insert(practiceData).values(rowsToInsert);
    }
  }

  return practiceLogId;
}

async function insertPracticeDataEntries(
  practiceLogId: string,
  entries: PracticeDataEntryInput[],
  defaultCompletedAt: Date,
  defaultRating: number | null = null,
) {
  const targetTypeMap = getTargetTypeMap();
  const rowsToInsert: Array<typeof practiceData.$inferInsert> = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let movementName = entry.movementName;
    let movementType = entry.movementType;
    let defaultWeightUnit: "lbs" | "kg" | "bodyweight" | null = null;
    let defaultTargetVal = entry.value;

    if (!movementName || !movementType) {
      const movementRecord = await db.query.movements.findFirst({
        where: eq(movements.id, entry.movementId),
      });
      if (!movementRecord) {
        throw new Error(`Movement "${entry.movementId}" not found`);
      }
      movementName = movementName ?? movementRecord.name;
      movementType = movementType ?? movementRecord.type;
      defaultWeightUnit = movementRecord.weightUnit ?? null;
      defaultTargetVal =
        movementRecord.metadata?.defaultTarget?.value ?? entry.value;
    }

    const targetType = entry.targetType ?? targetTypeMap[movementType];
    const targetValue = entry.targetValue ?? Math.max(1, defaultTargetVal);

    rowsToInsert.push({
      id: nanoid(),
      practiceLogId,
      movementId: entry.movementId,
      movementName,
      movementType,
      targetType,
      targetValue,
      order: entry.order ?? i,
      setNumber: entry.setNumber ?? 1,
      side: entry.side ?? null,
      value: entry.value,
      weight: entry.weight ?? null,
      weightUnit: entry.weightUnit ?? defaultWeightUnit,
      customMeasurement: entry.customMeasurement ?? null,
      rating: entry.rating ?? defaultRating,
      status: entry.status ?? "completed",
      completedAt: defaultCompletedAt,
    });
  }

  if (rowsToInsert.length > 0) {
    await db.insert(practiceData).values(rowsToInsert);
  }
}

export async function updatePractice(
  practiceId: string,
  input: PracticeUpdateInput,
) {
  const existing = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, practiceId),
  });

  if (!existing) {
    throw new Error("Practice not found");
  }

  const completedAt =
    input.completedAt !== undefined ? input.completedAt : existing.completedAt;
  const startedAt = input.startedAt ?? existing.startedAt;
  const duration =
    input.duration !== undefined ? input.duration : existing.duration;
  const notes = input.notes !== undefined ? input.notes : existing.notes;

  await db
    .update(practiceLogs)
    .set({
      startedAt,
      completedAt,
      duration,
      notes,
    })
    .where(eq(practiceLogs.id, practiceId));

  if (input.practiceData !== undefined) {
    await db
      .delete(practiceData)
      .where(eq(practiceData.practiceLogId, practiceId));

    if (input.practiceData.length > 0) {
      await insertPracticeDataEntries(
        practiceId,
        input.practiceData,
        completedAt ?? new Date(),
      );
    }
  }

  return practiceId;
}

export async function deletePractice(practiceId: string) {
  const existing = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, practiceId),
  });

  if (!existing) {
    throw new Error("Practice not found");
  }

  await db.delete(practiceLogs).where(eq(practiceLogs.id, practiceId));
}

export async function getPracticeStats(days: number = 30) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 86400000);

  const allCompleted = await db
    .select({
      id: practiceLogs.id,
      routineId: practiceLogs.routineId,
      routineName: routines.name,
      startedAt: practiceLogs.startedAt,
      completedAt: practiceLogs.completedAt,
      duration: practiceLogs.duration,
    })
    .from(practiceLogs)
    .leftJoin(routines, eq(practiceLogs.routineId, routines.id))
    .where(isNotNull(practiceLogs.completedAt))
    .orderBy(desc(practiceLogs.startedAt));

  const recentPractices = allCompleted.filter(
    (p) => p.startedAt >= cutoffDate,
  );

  const totalDurationSeconds = allCompleted.reduce(
    (sum, p) => sum + (p.duration ?? 0),
    0,
  );
  const periodDurationSeconds = recentPractices.reduce(
    (sum, p) => sum + (p.duration ?? 0),
    0,
  );

  const lastPractice = allCompleted[0] ?? null;
  const daysSinceLastPractice = lastPractice
    ? Math.floor(
        (now.getTime() - lastPractice.startedAt.getTime()) / 86400000,
      )
    : null;

  // Top routines in period
  const routineCounts = new Map<
    string,
    { routineId: string; routineName: string; count: number; totalDuration: number }
  >();
  for (const p of recentPractices) {
    const key = p.routineId;
    const prev = routineCounts.get(key) ?? {
      routineId: p.routineId,
      routineName: p.routineName ?? "Unknown",
      count: 0,
      totalDuration: 0,
    };
    prev.count += 1;
    prev.totalDuration += p.duration ?? 0;
    routineCounts.set(key, prev);
  }

  // Top movements in period
  const topMovementsRows = await db
    .select({
      movementId: practiceData.movementId,
      movementName: practiceData.movementName,
      movementType: practiceData.movementType,
      setsCompleted: count(practiceData.id),
      totalValue: sql<number>`sum(${practiceData.value})`,
    })
    .from(practiceData)
    .innerJoin(practiceLogs, eq(practiceData.practiceLogId, practiceLogs.id))
    .where(
      and(
        eq(practiceData.status, "completed"),
        gte(practiceLogs.startedAt, cutoffDate),
      ),
    )
    .groupBy(practiceData.movementId, practiceData.movementName)
    .orderBy(desc(count(practiceData.id)))
    .limit(10);

  return {
    periodDays: days,
    allTime: {
      totalPractices: allCompleted.length,
      totalDurationSeconds,
      totalDurationFormatted: formatDuration(totalDurationSeconds),
    },
    recentPeriod: {
      practicesCount: recentPractices.length,
      totalDurationSeconds: periodDurationSeconds,
      totalDurationFormatted: formatDuration(periodDurationSeconds),
    },
    lastPractice: lastPractice
      ? {
          id: lastPractice.id,
          routineId: lastPractice.routineId,
          routineName: lastPractice.routineName,
          startedAt: lastPractice.startedAt,
          duration: lastPractice.duration,
          durationFormatted:
            lastPractice.duration != null
              ? formatDuration(lastPractice.duration)
              : null,
          daysAgo: daysSinceLastPractice,
        }
      : null,
    topRoutines: Array.from(routineCounts.values()).sort(
      (a, b) => b.count - a.count,
    ),
    topMovements: topMovementsRows,
  };
}
