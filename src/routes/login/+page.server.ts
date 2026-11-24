import { auth } from "$lib/auth";
import { fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { claimGuestPractices } from "$lib/server/guest";

function getSafeRedirectTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export const load = async ({ url }: { url: URL }) => {
  const registered = url.searchParams.get("registered");
  const reset = url.searchParams.get("reset");
  const redirectTo = getSafeRedirectTo(url.searchParams.get("redirectTo"));
  return { registered, reset, redirectTo };
};

export const actions = {
  default: async ({ request, url, cookies }: RequestEvent) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const rawRedirectTo =
      formData.get("redirectTo")?.toString() ??
      url.searchParams.get("redirectTo");
    const redirectTo = getSafeRedirectTo(rawRedirectTo);

    if (!email || !password) {
      return fail(400, { missing: true });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return fail(400, { invalid: true });
    }

    try {
      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: request.headers,
      });

      if (!result) {
        return fail(400, { credentials: true });
      }

      if (
        typeof result === "object" &&
        "user" in result &&
        result.user &&
        result.user.id
      ) {
        await claimGuestPractices(cookies, result.user.id);
      }
    } catch (e) {
      console.error("Login error:", e);
      if (e && typeof e === "object" && "location" in e) {
        throw e;
      }
      return fail(400, { credentials: true });
    }

    redirect(302, redirectTo);
  },
};
