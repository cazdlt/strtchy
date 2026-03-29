import { json } from "@sveltejs/kit";
import { db } from "$lib/db";
import { movements } from "$lib/db/schema";
import { eq } from "drizzle-orm";
import { validateBearerToken, requireAuth } from "$lib/api/auth";
import { formatZodError, formatApiError } from "$lib/api/errors";
import { movementUpdateSchema } from "$lib/validation/schemas/movement";
import { updateMovement, deleteMovement } from "$lib/db/helpers/movements";
import type { RequestEvent } from "./$types";

// GET /api/movements/[id] - Get single movement (public)
export async function GET(event: RequestEvent) {
  try {
    const movement = await db.query.movements.findFirst({
      where: eq(movements.id, event.params.id),
    });

    if (!movement) {
      return json(
        { success: false, error: "Movement not found" },
        { status: 404 },
      );
    }

    return json({ success: true, movement });
  } catch (err) {
    return json(formatApiError(err), { status: 500 });
  }
}

// PATCH /api/movements/[id] - Update movement (authenticated)
export async function PATCH(event: RequestEvent) {
  try {
    const { user } = await validateBearerToken(event);
    requireAuth(user);

    const body = await event.request.json();

    const parsed = movementUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return json(formatZodError(parsed.error), { status: 400 });
    }

    await updateMovement(event.params.id, parsed.data, user.id);
    const updated = await db.query.movements.findFirst({
      where: eq(movements.id, event.params.id),
    });

    return json({ success: true, movement: updated });
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

// DELETE /api/movements/[id] - Delete movement (authenticated)
export async function DELETE(event: RequestEvent) {
  try {
    const { user } = await validateBearerToken(event);
    requireAuth(user);

    await deleteMovement(event.params.id, user.id);
    return json({ success: true, message: "Movement deleted" });
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
