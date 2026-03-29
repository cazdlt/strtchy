import { db } from "$lib/db";
import {
  practiceLogs,
  practiceData,
  routineMovements,
  movements,
} from "$lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { PageData } from "../$types";

export async function load({ params }: { params: { id: string } }) {
  // Load practice log with existing data
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

  // Load all routine movements to identify not-started ones
  const allRoutineMovements = await db.query.routineMovements.findMany({
    where: eq(routineMovements.routineId, practice.routineId),
    with: {
      movement: true,
    },
    orderBy: routineMovements.order,
  });

  // Get set overrides from the practice
  const setOverrides = practice.setOverrides || {};

  // Build a map of completed sets for each movement
  const completedSetsByMovement = new Map<string, Set<string>>();
  
  for (const pd of practice.practiceData) {
    const rmId = pd.routineMovementId;
    if (!completedSetsByMovement.has(rmId)) {
      completedSetsByMovement.set(rmId, new Set());
    }
    
    // Create a key for this set (includes side for bilateral)
    const setKey = pd.side 
      ? `${pd.setNumber}-${pd.side}` 
      : `${pd.setNumber}`;
    completedSetsByMovement.get(rmId)!.add(setKey);
  }

  // Build not-started movements list
  const notStartedMovements: Array<{
    routineMovementId: string;
    movement: typeof allRoutineMovements[0]['movement'];
    sets: number;
    isBilateral: boolean;
    missingSets: number;
  }> = [];

  for (const rm of allRoutineMovements) {
    const actualSets = setOverrides[rm.id] ?? rm.sets;
    const completedSets = completedSetsByMovement.get(rm.id) || new Set();
    
    // Calculate expected total sets (bilateral = 2 per set number)
    const expectedTotalSets = rm.isBilateral ? actualSets * 2 : actualSets;
    
    if (completedSets.size < expectedTotalSets) {
      const missingCount = expectedTotalSets - completedSets.size;
      notStartedMovements.push({
        routineMovementId: rm.id,
        movement: rm.movement,
        sets: actualSets,
        isBilateral: rm.isBilateral,
        missingSets: missingCount,
      });
    }
  }

  return {
    practice,
    allRoutineMovements,
    notStartedMovements,
  };
}
