import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/db';
import * as schema from '$lib/db/schema';

export const auth = betterAuth({
	secret: import.meta.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
	database: drizzleAdapter(db, {
		schema,
		provider: 'sqlite'
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	}
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
