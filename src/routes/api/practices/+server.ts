import { json } from "@sveltejs/kit";
import { validateBearerToken, requireAuth } from "$lib/api/auth";
import { formatZodError, formatApiError } from "$lib/api/errors";
import { practiceCreateSchema } from "$lib/validation/schemas/practice";
import {
  listPractices,
  createPractice,
  getPracticeById,
} from "$lib/db/helpers/practices";
import type { RequestEvent } from "./$types";

// GET /api/practices - List practice logs (public)
export async function GET(event: RequestEvent) {
  try {
    const url = event.url;
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const routineId = url.searchParams.get("routineId") || undefined;
    const completedOnly = url.searchParams.get("completedOnly") === "true";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const result = await listPractices({
      limit: limitParam ? parseInt(limitParam, 10) : 20,
      offset: offsetParam ? parseInt(offsetParam, 10) : 0,
      routineId,
      completedOnly,
      fromDate: fromParam ? new Date(fromParam) : undefined,
      toDate: toParam ? new Date(toParam) : undefined,
    });

    return json({
      success: true,
      practices: result.practices,
      pagination: result.pagination,
    });
  } catch (err) {
    return json(formatApiError(err), { status: 500 });
  }
}

// POST /api/practices - Log a practice session (authenticated)
export async function POST(event: RequestEvent) {
  try {
    const { user } = await validateBearerToken(event);
    requireAuth(user);

    const body = await event.request.json();
    const parsed = practiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return json(formatZodError(parsed.error), { status: 400 });
    }

    const practiceId = await createPractice(parsed.data, user?.id);
    const practice = await getPracticeById(practiceId);

    return json({ success: true, practice }, { status: 201 });
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
