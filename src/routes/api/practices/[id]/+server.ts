import { json } from "@sveltejs/kit";
import { validateBearerToken, requireAuth } from "$lib/api/auth";
import { formatZodError, formatApiError } from "$lib/api/errors";
import { practiceUpdateSchema } from "$lib/validation/schemas/practice";
import {
  getPracticeById,
  updatePractice,
  deletePractice,
  ForbiddenError,
} from "$lib/db/helpers/practices";
import type { RequestEvent } from "./$types";

async function getAuthUser(event: RequestEvent) {
  if (event.locals.user) {
    return event.locals.user;
  }
  const { user } = await validateBearerToken(event);
  return user;
}

// GET /api/practices/[id] - Get single practice with set data (authenticated)
export async function GET(event: RequestEvent) {
  try {
    const user = await getAuthUser(event);
    requireAuth(user);

    const practice = await getPracticeById(event.params.id, user.id);

    if (!practice) {
      return json(
        { success: false, error: "Practice not found" },
        { status: 404 },
      );
    }

    return json({ success: true, practice });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return json({ success: false, error: err.message }, { status: 403 });
    }
    return json(formatApiError(err), { status: 500 });
  }
}

// PATCH /api/practices/[id] - Update practice log (authenticated)
export async function PATCH(event: RequestEvent) {
  try {
    const user = await getAuthUser(event);
    requireAuth(user);

    const body = await event.request.json();
    const parsed = practiceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return json(formatZodError(parsed.error), { status: 400 });
    }

    await updatePractice(event.params.id, parsed.data, user.id);
    const updated = await getPracticeById(event.params.id, user.id);

    return json({ success: true, practice: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return json({ success: false, error: err.message }, { status: 403 });
    }
    if (err instanceof Error && err.message.includes("not found")) {
      return json({ success: false, error: err.message }, { status: 404 });
    }
    return json(formatApiError(err), { status: 500 });
  }
}

// DELETE /api/practices/[id] - Delete practice log (authenticated)
export async function DELETE(event: RequestEvent) {
  try {
    const user = await getAuthUser(event);
    requireAuth(user);

    await deletePractice(event.params.id, user.id);
    return json({ success: true, message: "Practice deleted" });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return json({ success: false, error: err.message }, { status: 403 });
    }
    if (err instanceof Error && err.message.includes("not found")) {
      return json({ success: false, error: err.message }, { status: 404 });
    }
    return json(formatApiError(err), { status: 500 });
  }
}
