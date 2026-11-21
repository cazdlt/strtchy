import { json } from "@sveltejs/kit";
import { validateBearerToken, requireAuth } from "$lib/api/auth";
import { formatApiError } from "$lib/api/errors";
import { getPracticeStats, ForbiddenError } from "$lib/db/helpers/practices";
import type { RequestEvent } from "./$types";

async function getAuthUser(event: RequestEvent) {
  if (event.locals.user) {
    return event.locals.user;
  }
  const { user } = await validateBearerToken(event);
  return user;
}

// GET /api/practices/stats - Get aggregated practice statistics (authenticated)
export async function GET(event: RequestEvent) {
  try {
    const user = await getAuthUser(event);
    requireAuth(user);

    const daysParam = event.url.searchParams.get("days");
    const days = daysParam ? Math.max(1, parseInt(daysParam, 10)) : 30;
    const stats = await getPracticeStats(days, user.id);

    return json({ success: true, stats });
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
