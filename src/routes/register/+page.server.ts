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
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: username
				}
			});

			redirect(302, '/login?registered=true');
		} catch (e) {
			return fail(400, { email: 'already_exists' });
		}
	}
};
