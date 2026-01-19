import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildSteamLoginUrl } from '$lib/steam';

export const GET: RequestHandler = async ({ url }) => {
	const returnUrl = `${url.origin}/api/auth/callback`;
	const steamLoginUrl = buildSteamLoginUrl(returnUrl);

	throw redirect(302, steamLoginUrl);
};
