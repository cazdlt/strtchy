import { auth } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeHexLowerCase } from '@oslojs/encoding';

export const load = async ({ url }) => {
	const registered = url.searchParams.get('registered');
	return { registered };
};

export const actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { missing: true });
		}

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { invalid: true });
		}

		const user = db.select().from(users).where(eq(users.email, email)).get();

		if (!user) {
			return fail(400, { credentials: true });
		}

		const passwordHash = encodeHexLowerCase(sha256(new TextEncoder().encode(password)));

		if (user.passwordHash !== passwordHash) {
			return fail(400, { credentials: true });
		}

		const session = await auth.createSession(user.id, {});
		const sessionCookie = auth.createSessionCookie(session);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	}
};
