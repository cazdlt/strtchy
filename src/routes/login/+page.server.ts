import { auth } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export const load = async ({ url }: { url: URL }) => {
	const registered = url.searchParams.get('registered');
	return { registered };
};

export const actions = {
	default: async ({ request, cookies }: RequestEvent) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { missing: true });
		}

		if (typeof email !== 'string' || typeof password !== 'string') {
			return fail(400, { invalid: true });
		}

		try {
			const session = await auth.api.signInEmail({
				body: {
					email,
					password
				},
				headers: new Headers({
					cookie: request.headers.get('cookie') || ''
				})
			});

			if (session) {
				if (session.token) {
					cookies.set('better-auth.session_token', session.token, {
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: import.meta.env.PROD
					});
				}
				redirect(302, '/');
			} else {
				return fail(400, { credentials: true });
			}
		} catch (e) {
			return fail(400, { credentials: true });
		}
	}
};
