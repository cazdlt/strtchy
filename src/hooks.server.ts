import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
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

  return svelteKitHandler({ event, resolve, auth, building });
};
