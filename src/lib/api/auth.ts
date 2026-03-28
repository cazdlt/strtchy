import { db } from '$lib/db';
import { session } from '$lib/db/schema';
import { eq, gt, and } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

export async function validateBearerToken(event: RequestEvent): Promise<{ user: any | null; session: any | null }> {
	const authHeader = event.request.headers.get('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return { user: null, session: null };
	}

	const token = authHeader.substring(7);

	const sessionResult = await db.query.session.findFirst({
		where: and(eq(session.token, token), gt(session.expiresAt, new Date())),
		with: {
			user: true
		}
	});

	if (!sessionResult) {
		return { user: null, session: null };
	}

	return {
		user: sessionResult.user,
		session: {
			id: sessionResult.id,
			token: sessionResult.token,
			expiresAt: sessionResult.expiresAt
		}
	};
}

export function requireAuth(user: any | null): void {
	if (!user) {
		throw new Error('Unauthorized');
	}
}
