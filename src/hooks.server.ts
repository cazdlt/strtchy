import { auth } from "$lib/auth";
import { checkRateLimit } from "$lib/server/rate-limit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect, type Handle } from "@sveltejs/kit";

const AUTH_RATE_LIMIT = 15;
const API_RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

const PROTECTED_ROUTE_PATTERNS = [
  /^\/routine\/create(\/.*)?$/,
  /^\/routine\/[^/]+\/edit(\/.*)?$/,
  /^\/movement\/create(\/.*)?$/,
  /^\/movement\/[^/]+\/edit(\/.*)?$/,
  /^\/practices(\/.*)?$/,
  /^\/profile(\/.*)?$/,
];

function getClientIp(event: Parameters<Handle>[0]["event"]): string {
  try {
    return event.getClientAddress();
  } catch {
    return (
      event.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
  }
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const method = event.request.method;
  const ip = getClientIp(event);

  const isAuthSubmission =
    method === "POST" &&
    (pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname.startsWith("/api/auth/"));

  if (isAuthSubmission) {
    const result = checkRateLimit(
      `auth:${ip}:${pathname}`,
      AUTH_RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!result.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      );
    }
  } else if (pathname.startsWith("/api/")) {
    const result = checkRateLimit(`api:${ip}`, API_RATE_LIMIT, RATE_WINDOW_MS);
    if (!result.allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      );
    }
  }

  // Fetch current session from Better Auth
  const sessionResult = await auth.api.getSession({
    headers: event.request.headers,
  });

  // Make session and user available on server
  if (sessionResult) {
    event.locals.session = sessionResult.session;
    event.locals.user = sessionResult.user;
  } else {
    event.locals.session = null;
    event.locals.user = null;
  }

  if (!event.locals.user && isProtectedRoute(pathname)) {
    const redirectTo = encodeURIComponent(pathname + event.url.search);
    redirect(302, `/login?redirectTo=${redirectTo}`);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
