import { db } from "$lib/db";
import { routines, routineMovements, movements } from "$lib/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { calculateRoutineDuration } from "$lib/utils/formatting";
import { redirect, fail } from "@sveltejs/kit";
import { deleteRoutine, ForbiddenError } from "$lib/db/helpers/routines";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const routineWhere = locals.user
    ? or(eq(routines.isCustom, false), eq(routines.userId, locals.user.id))
    : eq(routines.isCustom, false);

  const allRoutines = await db
    .select()
    .from(routines)
    .where(routineWhere)
    .orderBy(desc(routines.createdAt));

  const routinesWithCounts = await Promise.all(
    allRoutines.map(async (routine) => {
      const movementsData = await db
        .select({
          routineMovement: routineMovements,
          movement: movements,
        })
        .from(routineMovements)
        .innerJoin(movements, eq(routineMovements.movementId, movements.id))
        .where(eq(routineMovements.routineId, routine.id));

      const movementsCount = movementsData.length;

      const estimatedDuration = calculateRoutineDuration(
        movementsData.map((item) => ({
          target: item.routineMovement.target,
          sets: item.routineMovement.sets,
          isBilateral: item.routineMovement.isBilateral,
          switchSidesDuration: item.routineMovement.switchSidesDuration,
          timePerRep: item.movement.timePerRep,
        })),
        routine.restBetweenMovements,
        routine.restBetweenSets,
      );

      return { ...routine, movementsCount, estimatedDuration };
    }),
  );

  return {
    routines: routinesWithCounts,
    user: locals.user,
  };
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { unauthorized: true });
    }

    const formData = await request.formData();
    const id = formData.get("id");

    if (!id || typeof id !== "string") {
      return fail(400, { missing: true });
    }

    try {
      await deleteRoutine(id, locals.user.id);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return fail(403, { forbidden: true, error: error.message });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return fail(404, { not_found: true });
      }
      return fail(500, { error: "Failed to delete routine" });
    }

    throw redirect(303, "/routines");
  },
};
