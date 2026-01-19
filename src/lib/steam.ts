import { env } from '$env/dynamic/private';

const STEAM_API_BASE = 'https://api.steampowered.com';

export interface SteamGame {
	appid: number;
	name: string;
	playtime_forever: number;
	playtime_2weeks?: number;
	img_icon_url: string;
	rtime_last_played?: number;
}

export interface SteamPlayer {
	steamid: string;
	personaname: string;
	avatarfull: string;
	profileurl: string;
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
	const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`);
	url.searchParams.set('key', env.STEAM_API_KEY || '');
	url.searchParams.set('steamid', steamId);
	url.searchParams.set('include_appinfo', '1');
	url.searchParams.set('include_played_free_games', '1');

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`Steam API error: ${response.status}`);
	}

	const data = await response.json();
	return data.response.games || [];
}

export async function getRecentlyPlayedGames(steamId: string, count: number = 50): Promise<SteamGame[]> {
	const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/`);
	url.searchParams.set('key', env.STEAM_API_KEY || '');
	url.searchParams.set('steamid', steamId);
	url.searchParams.set('count', count.toString());

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`Steam API error: ${response.status}`);
	}

	const data = await response.json();
	return data.response.games || [];
}

export async function getPlayerSummary(steamId: string): Promise<SteamPlayer | null> {
	const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
	url.searchParams.set('key', env.STEAM_API_KEY || '');
	url.searchParams.set('steamids', steamId);

	const response = await fetch(url.toString());
	if (!response.ok) {
		throw new Error(`Steam API error: ${response.status}`);
	}

	const data = await response.json();
	const players = data.response.players;
	return players.length > 0 ? players[0] : null;
}

export function getGameImageUrl(appid: number, hash: string): string {
	if (!hash) {
		return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
	}
	return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
}

export function getGameHeaderUrl(appid: number): string {
	return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export interface SteamPlatforms {
	windows: boolean;
	mac: boolean;
	linux: boolean;
}

// Simple in-memory cache for platform data
const platformCache = new Map<number, SteamPlatforms | null>();

async function fetchWithRetry(url: string, retries = 3, delay = 200): Promise<Response | null> {
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url);
			
			// If rate limited, wait and retry
			if (response.status === 429 || response.status === 503) {
				await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
				continue;
			}
			
			return response;
		} catch {
			if (i < retries - 1) {
				await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
			}
		}
	}
	return null;
}

export async function getGamePlatforms(appid: number): Promise<SteamPlatforms | null> {
	// Check cache first
	if (platformCache.has(appid)) {
		return platformCache.get(appid) ?? null;
	}

	try {
		const response = await fetchWithRetry(`https://store.steampowered.com/api/appdetails?appids=${appid}`);

		if (!response || !response.ok) {
			return null;
		}

		const data = await response.json();
		const appData = data[appid.toString()];

		if (!appData?.success || !appData?.data?.platforms) {
			platformCache.set(appid, null);
			return null;
		}

		const platforms = appData.data.platforms as SteamPlatforms;
		platformCache.set(appid, platforms);
		return platforms;
	} catch {
		return null;
	}
}

export function buildSteamLoginUrl(returnUrl: string): string {
	const params = new URLSearchParams({
		'openid.ns': 'http://specs.openid.net/auth/2.0',
		'openid.mode': 'checkid_setup',
		'openid.return_to': returnUrl,
		'openid.realm': new URL(returnUrl).origin,
		'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
		'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
	});

	return `https://steamcommunity.com/openid/login?${params.toString()}`;
}

export async function verifySteamLogin(params: URLSearchParams): Promise<string | null> {
	const validationParams = new URLSearchParams();

	for (const [key, value] of params.entries()) {
		validationParams.set(key, value);
	}
	validationParams.set('openid.mode', 'check_authentication');

	const response = await fetch('https://steamcommunity.com/openid/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: validationParams.toString()
	});

	const text = await response.text();

	if (text.includes('is_valid:true')) {
		const claimedId = params.get('openid.claimed_id');
		if (claimedId) {
			// Steam OpenID returns URLs like: https://steamcommunity.com/openid/id/76561198012345678
			const match = claimedId.match(/\/openid\/id\/(\d+)$/);
			if (match) {
				return match[1];
			}
		}
	}

	return null;
}
