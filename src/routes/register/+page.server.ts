import { auth } from "$lib/auth";
import { db } from "$lib/db";
import { user } from "$lib/db/schema";
import { eq } from "drizzle-orm";
import { fail, redirect } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { generateApiKey } from "$lib/api/apiKey";

export const actions = {
  default: async ({ request }: RequestEvent) => {
    const formData = await request.formData();
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    if (!username || !email || !password) {
      return fail(400, { missing: true });
    }

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return fail(400, { invalid: true });
    }

    try {
      console.log("Attempting to register user:", { username, email });
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: username,
          username,
        },
      });

      console.log("Sign up result:", result);

      // Generate API key for the new user
      const { plaintext, hash, prefix } = generateApiKey();

      // Get the user ID from the result or query for it
      let userId: string | undefined;
      if (
        result &&
        typeof result === "object" &&
        "user" in result &&
        result.user
      ) {
        userId = result.user.id;
      }

      // If we couldn't get the user ID from the result, query by email
      if (!userId) {
        const userData = await db.query.user.findFirst({
          where: eq(user.email, email),
        });
        userId = userData?.id;
      }

      if (userId) {
        await db
          .update(user)
          .set({
            apiKeyHash: hash,
            apiKeyPrefix: prefix,
            apiKeyCreatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        console.log("API key generated for user:", userId);
      }

      // Store the plaintext API key temporarily for display
      // In production, you might want to show this on a separate page
      // or send it via email. For now, we'll pass it as a query param.
      const redirectUrl = `/login?registered=true&apiKey=${encodeURIComponent(plaintext)}`;

      // BetterAuth might return a redirect object
      if (result && typeof result === "object" && "location" in result) {
        console.log("Redirecting to:", result.location);
        throw redirect(302, redirectUrl);
      }

      redirect(302, redirectUrl);
    } catch (e: any) {
      // If it's already a redirect, let it bubble up
      if (e && typeof e === "object" && "location" in e) {
        throw e;
      }
      console.error("Registration error:", e);
      const message = e?.message || "Registration failed";
      return fail(400, { error: message });
    }
  },
};
