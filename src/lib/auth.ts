import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/db";
import * as schema from "$lib/db/schema";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
if (!betterAuthSecret && !building && process.env.NODE_ENV === "production") {
  throw new Error(
    "BETTER_AUTH_SECRET environment variable is required in production",
  );
}

export const auth = betterAuth({
  secret: betterAuthSecret || "dev-secret-change-in-production",
  database: drizzleAdapter(db, {
    schema,
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "Strtchy <noreply@strtchy.app>";
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [user.email],
            subject: "Reset your Strtchy password",
            html: `<p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            "[auth] Failed to send reset password email via Resend:",
            response.status,
            errorBody,
          );
        }
      } else {
        console.info(
          JSON.stringify({
            event: "password_reset_requested",
            email: user.email,
            resetUrl: url,
          }),
        );
      }
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (userData) => {
        // Custom cleanup before deletion if needed
        console.log("Deleting user:", userData.id);
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    disableCSRFCheck: false,
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  plugins: [sveltekitCookies(getRequestEvent)],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
