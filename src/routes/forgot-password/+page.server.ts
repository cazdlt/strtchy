import { auth } from "$lib/auth";
import { fail } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

export const actions = {
  default: async ({ request, url }: RequestEvent) => {
    const formData = await request.formData();
    const email = formData.get("email");

    if (!email || typeof email !== "string" || !email.trim()) {
      return fail(400, { missing: true });
    }

    try {
      await auth.api.requestPasswordReset({
        body: {
          email: email.trim(),
          redirectTo: `${url.origin}/reset-password`,
        },
        headers: request.headers,
      });

      return {
        success: true,
        message:
          "If an account exists for that email, a password reset link has been sent.",
      };
    } catch (e: any) {
      console.error("Forgot password error:", e);
      return fail(400, {
        error: e?.message || "Unable to process password reset request",
      });
    }
  },
};
