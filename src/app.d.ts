// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session } from '$lib/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				emailVerified: boolean;
				image: string | null;
				createdAt: Date;
				updatedAt: Date;
			} | null;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
