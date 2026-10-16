import { json } from "@sveltejs/kit";
import { formatApiError } from "$lib/api/errors";
import { getPracticeStats } from "$lib/db/helpers/practices";
import type { RequestEvent } from "./$types";

// GET /api/practices/stats - Get aggregated practice statistics (public)
export async function GET(event: RequestEvent) {
  try {
    const daysParam = event.url.searchParams.get("days");
    const days = daysParam ? Math.max(1, parseInt(daysParam, 10)) : 30;
    const stats = await getPracticeStats(days);

    return json({ success: true, stats });
  } catch (err) {
    return json(formatApiError(err), { status: 500 });
  }
}
