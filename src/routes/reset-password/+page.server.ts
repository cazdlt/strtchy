import { auth } from "$lib/auth";
import { fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

export const load = async ({ url }: { url: URL }) => {
  const token = url.searchParams.get("token");
  const error = url.searchParams.get("error");
  return { token, error };
};

export const actions = {
  default: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const token = formData.get("token");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (!token || typeof token !== "string") {
      return fail(400, { error: "Invalid or missing reset token." });
    }

    if (
      !newPassword ||
      !confirmPassword ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return fail(400, { missing: true });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { error: "Passwords do not match." });
    }

    if (newPassword.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters." });
    }

    try {
      await auth.api.resetPassword({
        body: {
          newPassword,
          token,
        },
        headers: request.headers,
      });
    } catch (e: any) {
      if (e && typeof e === "object" && "location" in e) {
        throw e;
      }
      console.error("Reset password error:", e);
      const message =
        e?.body?.message ||
        e?.message ||
        "Invalid or expired reset token. Please request a new link.";
      return fail(400, { error: message });
    }

    redirect(302, "/login?reset=true");
  },
};
