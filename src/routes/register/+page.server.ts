import { auth } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export const actions = {
	default: async ({ request }: RequestEvent) => {
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

		try {
			console.log('Attempting to register user:', { username, email });
			const result = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: username,
					username
				}
			});

			console.log('Sign up result:', result);

			// BetterAuth might return a redirect object
			if (result && typeof result === 'object' && 'location' in result) {
				console.log('Redirecting to:', result.location);
				throw redirect(302, result.location as string);
			}

			redirect(302, '/login?registered=true');
		} catch (e: any) {
			// If it's already a redirect, let it bubble up
			if (e && typeof e === 'object' && 'location' in e) {
				throw e;
			}
			console.error('Registration error:', e);
			const message = e?.message || 'Registration failed';
			return fail(400, { error: message });
		}
	}
};
