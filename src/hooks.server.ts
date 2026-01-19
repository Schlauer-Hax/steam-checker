import type { Handle } from '@sveltejs/kit';
import type { UserSession } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('steam_session');

	if (sessionCookie) {
		try {
			const session: UserSession = JSON.parse(sessionCookie);
			event.locals.user = session;
		} catch {
			// Invalid session cookie, clear it
			event.cookies.delete('steam_session', { path: '/' });
		}
	}

	return resolve(event);
};
