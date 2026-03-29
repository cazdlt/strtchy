import { auth } from "$lib/auth";
import { fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

export const load = async ({ url }: { url: URL }) => {
  const registered = url.searchParams.get("registered");
  const apiKey = url.searchParams.get("apiKey");
  return { registered, apiKey };
};

export const actions = {
  default: async ({ request, cookies }: RequestEvent) => {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      return fail(400, { missing: true });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return fail(400, { invalid: true });
    }

    try {
      console.log("Attempting login for:", email);
      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: request.headers,
      });

      console.log("Sign in result:", result);

      if (!result) {
        console.log("No session returned");
        return fail(400, { credentials: true });
      }
    } catch (e) {
      console.error("Login error:", e);
      // If it's a SvelteKit redirect, let it bubble up
      if (e && typeof e === "object" && "location" in e) {
        throw e;
      }
      return fail(400, { credentials: true });
    }

    redirect(302, "/");
  },
};
