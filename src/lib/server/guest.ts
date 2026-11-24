import type { Cookies } from "@sveltejs/kit";
import { nanoid } from "nanoid";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "$lib/db";
import { practiceLogs } from "$lib/db/schema";

export const GUEST_COOKIE_NAME = "strtchy_guest_id";

const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Return the existing guest ID from cookies, or null if none is set.
 */
export function getGuestId(cookies: Cookies): string | null {
  return cookies.get(GUEST_COOKIE_NAME) ?? null;
}

/**
 * Return the existing guest ID from cookies, or generate a new one and set
 * the HttpOnly guest session cookie.
 */
export function getOrCreateGuestId(cookies: Cookies): string {
  const existing = getGuestId(cookies);
  if (existing) {
    return existing;
  }

  const guestId = nanoid();
  cookies.set(GUEST_COOKIE_NAME, guestId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return guestId;
}

/**
 * Check whether the current user or guest cookie owns the given practice log.
 */
export function canAccessPractice(
  practice: { userId: string | null; guestId: string | null },
  userId: string | null | undefined,
  cookies: Cookies,
): boolean {
  if (userId) {
    return practice.userId === userId;
  }
  const guestId = getGuestId(cookies);
  return (
    practice.userId === null &&
    Boolean(practice.guestId) &&
    practice.guestId === guestId
  );
}

/**
 * Claim all anonymous practice logs associated with the current guest cookie
 * for the authenticated user, then clear the guest cookie.
 */
export async function claimGuestPractices(
  cookies: Cookies,
  userId: string,
): Promise<void> {
  const guestId = getGuestId(cookies);
  if (!guestId) {
    return;
  }

  await db
    .update(practiceLogs)
    .set({
      userId,
      guestId: null,
    })
    .where(and(eq(practiceLogs.guestId, guestId), isNull(practiceLogs.userId)));

  cookies.delete(GUEST_COOKIE_NAME, { path: "/" });
}
