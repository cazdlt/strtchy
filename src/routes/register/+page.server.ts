import { auth } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');

		if (!username || !email || !password) {
			return fail(400, { missing: true });
		}

		if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { invalid: true });
		}

		// Check if user already exists
		const existingUser = db.select().from(users).where(eq(users.email, email)).get();
		if (existingUser) {
			return fail(400, { email: 'already_exists' });
		}

		// Hash password
		const passwordHash = encodeHexLowerCase(sha256(new TextEncoder().encode(password)));

		// Create user
		const userId = nanoid();
		db.insert(users).values({
			id: userId,
			username,
			email,
			passwordHash,
			createdAt: new Date()
		});

		// Create session
		const session = await auth.createSession(userId, {});
		const sessionCookie = auth.createSessionCookie(session);

		redirect(302, '/login?registered=true');
	}
};
