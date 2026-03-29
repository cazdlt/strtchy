import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { routines, routineMovements } from "$lib/db/schema";
import { eq } from "drizzle-orm";
import { validateBearerToken, requireAuth } from "$lib/api/auth";
import { formatZodError, formatApiError } from "$lib/api/errors";
import {
  routineUpdateSchema,
  routineMovementConfigSchema,
} from "$lib/validation/schemas/routine";
import { updateRoutine, deleteRoutine } from "$lib/db/helpers/routines";
import { z } from "zod";
import type { RequestEvent } from "./$types";

// GET /api/routines/[id] - Get single routine with movements (public)
export async function GET(event: RequestEvent) {
  try {
    const routine = await db.query.routines.findFirst({
      where: eq(routines.id, event.params.id),
      with: {
        movements: {
          with: { movement: true },
          orderBy: routineMovements.order,
        },
      },
    });

    if (!routine) {
      return json(
        { success: false, error: "Routine not found" },
        { status: 404 },
      );
    }

    return json({ success: true, routine });
  } catch (err) {
    return json(formatApiError(err), { status: 500 });
  }
}

// PATCH /api/routines/[id] - Update routine (authenticated)
export async function PATCH(event: RequestEvent) {
  try {
    const { user } = await validateBearerToken(event);
    requireAuth(user);

    const body = await event.request.json();

    // Validate routine fields
    const routineParsed = routineUpdateSchema.safeParse(body);
    if (!routineParsed.success) {
      return json(formatZodError(routineParsed.error), { status: 400 });
    }

    // Validate movements if provided
    let movementsData;
    if (body.movementsData) {
      const movementsSchema = z.array(routineMovementConfigSchema);
      const movementsParsed = movementsSchema.safeParse(body.movementsData);
      if (!movementsParsed.success) {
        return json(formatZodError(movementsParsed.error), { status: 400 });
      }
      movementsData = movementsParsed.data;
    }

    await updateRoutine(
      event.params.id,
      routineParsed.data,
      movementsData || [],
      user?.id,
    );

    const updated = await db.query.routines.findFirst({
      where: eq(routines.id, event.params.id),
      with: {
        movements: {
          with: { movement: true },
          orderBy: routineMovements.order,
        },
      },
    });

    return json({ success: true, routine: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("already exists")) {
      return json({ success: false, error: err.message }, { status: 409 });
    }
    if (err instanceof Error && err.message.includes("not found")) {
      return json({ success: false, error: err.message }, { status: 404 });
    }
    return json(formatApiError(err), { status: 500 });
  }
}

// DELETE /api/routines/[id] - Delete routine (authenticated)
export async function DELETE(event: RequestEvent) {
  try {
    const { user } = await validateBearerToken(event);
    requireAuth(user);

    await deleteRoutine(event.params.id, user?.id);
    return json({ success: true, message: "Routine deleted" });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("not found")) {
      return json({ success: false, error: err.message }, { status: 404 });
    }
    return json(formatApiError(err), { status: 500 });
  }
}
