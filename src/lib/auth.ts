import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/db";
import * as schema from "$lib/db/schema";

export const auth = betterAuth({
  secret:
    import.meta.env.BETTER_AUTH_SECRET || "dev-secret-change-in-production",
  database: drizzleAdapter(db, {
    schema,
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
    useSecureCookies: false,
    disableCSRFCheck: true,
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
