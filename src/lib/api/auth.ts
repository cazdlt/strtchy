import { db } from '$lib/db';
import { user } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';
import { extractApiKeyFromHeader, validateApiKey } from './apiKey';

/**
 * Validate API key from Authorization header
 * Replaces session token validation with API key validation
 */
export async function validateBearerToken(event: RequestEvent): Promise<{ user: any | null }> {
	const authHeader = event.request.headers.get('Authorization');
	
	// Try to extract API key from header
	const apiKey = extractApiKeyFromHeader(authHeader);
	
	if (!apiKey) {
		return { user: null };
	}
	
	// Validate the API key
	const userData = await validateApiKey(apiKey);
	
	if (!userData) {
		return { user: null };
	}
	
	return { user: userData };
}

export function requireAuth(user: any | null): void {
	if (!user) {
		throw new Error('Unauthorized');
	}
}
