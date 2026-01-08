import { Lucia } from 'lucia';
import { drizzleAdapter } from '$lib/db/adapter';

export const auth = new Lucia({
	adapter: drizzleAdapter(),
	env: import.meta.env.DEV ? 'DEV' : 'PROD',
	getUserAttributes: (data) => {
		return {
			username: data.username,
			email: data.email
		};
	}
});

export type Auth = typeof auth;
