import { db } from "$lib/db";
import { practiceLogs, practiceData } from "$lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect, error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(302, `/login?redirectTo=/practice/${params.id}/summary`);
  }

  const practice = await db.query.practiceLogs.findFirst({
    where: eq(practiceLogs.id, params.id),
    with: {
      routine: true,
    },
  });

  if (!practice || practice.userId !== locals.user.id) {
    throw error(404, "Practice not found");
  }

  // Self-contained practice data — no joins needed
  const data = await db.query.practiceData.findMany({
    where: eq(practiceData.practiceLogId, params.id),
    orderBy: [asc(practiceData.order), asc(practiceData.setNumber), asc(practiceData.side)],
  });

  return {
    practice,
    practiceData: data,
    user: locals.user,
  };
};
