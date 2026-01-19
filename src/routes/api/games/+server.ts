import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOwnedGames, getRecentlyPlayedGames, getGameHeaderUrl, getGamePlatforms } from '$lib/steam';
import { getProtonDBRating } from '$lib/protondb';
import { calculateOverallPlayability, type GameWithCompatibility } from '$lib/types';
import type { UserSession } from '$lib/types';
import { getCachedGames, setCachedGames, invalidateCache, getCacheInfo } from '$lib/server/cache';

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Process games in batches to avoid rate limiting
async function processGamesInBatches(
	games: { appid: number; name: string; playtime_forever: number; playtime_2weeks?: number; rtime_last_played?: number; img_icon_url: string }[],
	batchSize: number = 5,
	delayMs: number = 500
): Promise<GameWithCompatibility[]> {
	const results: GameWithCompatibility[] = [];

	for (let i = 0; i < games.length; i += batchSize) {
		const batch = games.slice(i, i + batchSize);

		const batchResults = await Promise.all(
			batch.map(async (game) => {
				// Fetch ProtonDB and Steam platform data in parallel
				const [protondb, platforms] = await Promise.all([
					getProtonDBRating(game.appid),
					getGamePlatforms(game.appid)
				]);

				// Check if game has native Linux support
				const isNative = platforms?.linux === true;

				// Determine the effective rating
				let effectiveRating = protondb?.tier || null;
				if (isNative) {
					effectiveRating = 'native';
				}

				const overallPlayability = calculateOverallPlayability(effectiveRating);

				return {
					appid: game.appid,
					name: game.name,
					playtime_forever: game.playtime_forever,
					playtime_2weeks: game.playtime_2weeks,
					rtime_last_played: game.rtime_last_played,
					img_icon_url: game.img_icon_url,
					headerUrl: getGameHeaderUrl(game.appid),
					protondb: {
						rating: effectiveRating,
						confidence: protondb?.confidence || 'native',
						trendingTier: protondb?.trendingTier
					},
					overallPlayability
				};
			})
		);

		results.push(...batchResults);

		if (i + batchSize < games.length) {
			await delay(delayMs);
		}
	}

	return results;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionCookie = cookies.get('steam_session');

	if (!sessionCookie) {
		throw error(401, 'Not authenticated');
	}

	let session: UserSession;
	try {
		session = JSON.parse(sessionCookie);
	} catch {
		throw error(401, 'Invalid session');
	}

	const type = url.searchParams.get('type') || 'all';
	const forceRefresh = url.searchParams.get('refresh') === 'true';
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? parseInt(limitParam, 10) : null;

	// For "all" type, check cache first (unless force refresh)
	if (type === 'all' && !forceRefresh) {
		const cached = getCachedGames(session.steamId);
		if (cached) {
			let games = cached.games;
			if (limit) {
				games = games.slice(0, limit);
			}
			const cacheInfo = getCacheInfo(session.steamId);
			return json({
				games,
				total: games.length,
				cached: true,
				cacheAge: cacheInfo.age
			});
		}
	}

	// Invalidate cache if force refresh
	if (forceRefresh) {
		invalidateCache(session.steamId);
	}

	let games;
	if (type === 'recent') {
		games = await getRecentlyPlayedGames(session.steamId, limit || 50);
	} else {
		games = await getOwnedGames(session.steamId);
		games = games.sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0));
	}

	// Process games in batches with rate limiting
	// Using smaller batches and longer delays due to Steam API rate limits
	const gamesWithCompatibility = await processGamesInBatches(games, 5, 200);

	// Cache the results for "all" type
	if (type === 'all') {
		setCachedGames(session.steamId, gamesWithCompatibility);
	}

	let finalGames = gamesWithCompatibility;
	if (limit) {
		finalGames = gamesWithCompatibility.slice(0, limit);
	}

	return json({
		games: finalGames,
		total: finalGames.length,
		cached: false,
		cacheAge: null
	});
};
