import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifySteamLogin, getPlayerSummary } from '$lib/steam';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const params = url.searchParams;

	// Verify the Steam OpenID response
	const steamId = await verifySteamLogin(params);

	if (!steamId) {
		throw redirect(302, '/?error=auth_failed');
	}

	// Get player info
	const player = await getPlayerSummary(steamId);

	if (!player) {
		throw redirect(302, '/?error=player_not_found');
	}

	// Store session in cookie
	const sessionData = {
		steamId: player.steamid,
		personaName: player.personaname,
		avatar: player.avatarfull,
		profileUrl: player.profileurl
	};

	cookies.set('steam_session', JSON.stringify(sessionData), {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});

	throw redirect(302, '/library');
};
