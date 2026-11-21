import { db } from "$lib/db";
import { movements } from "$lib/db/schema";
import { desc, eq, or } from "drizzle-orm";
import { redirect, fail } from "@sveltejs/kit";
import { deleteMovement, ForbiddenError } from "$lib/db/helpers/movements";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login?redirectTo=/movements");
  }

  const allMovements = await db
    .select()
    .from(movements)
    .where(
      or(eq(movements.isCustom, false), eq(movements.userId, locals.user.id)),
    )
    .orderBy(desc(movements.createdAt));

  return {
    movements: allMovements,
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
      await deleteMovement(id, locals.user.id);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return fail(403, { forbidden: true, error: error.message });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return fail(404, { not_found: true });
      }
      return fail(500, { error: "Failed to delete movement" });
    }

    throw redirect(303, "/movements");
  },
};
