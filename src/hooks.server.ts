import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('better-auth.session_token');

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	try {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		if (session) {
			event.locals.user = session.user as any;
			event.locals.session = session.session as any;
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	} catch (e) {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
