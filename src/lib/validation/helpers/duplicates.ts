import { db } from "$lib/db";
import { movements, routines } from "$lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function checkDuplicateMovementName(
  name: string,
  excludeId?: string,
): Promise<{ exists: boolean; existingName?: string }> {
  const existing = await db.query.movements.findFirst({
    where: excludeId
      ? and(eq(movements.name, name), ne(movements.id, excludeId))
      : eq(movements.name, name),
  });

  return {
    exists: !!existing,
    existingName: existing?.name,
  };
}

export async function checkDuplicateRoutineName(
  name: string,
  excludeId?: string,
): Promise<{ exists: boolean; existingName?: string }> {
  const existing = await db.query.routines.findFirst({
    where: excludeId
      ? and(eq(routines.name, name), ne(routines.id, excludeId))
      : eq(routines.name, name),
  });

  return {
    exists: !!existing,
    existingName: existing?.name,
  };
}
