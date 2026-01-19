import type { RequestHandler } from './$types';
import { getOwnedGames, getRecentlyPlayedGames, getGameHeaderUrl, getGamePlatforms } from '$lib/steam';
import { getProtonDBRating } from '$lib/protondb';
import { calculateOverallPlayability, type GameWithCompatibility } from '$lib/types';
import type { UserSession } from '$lib/types';
import { getCachedGames, setCachedGames, invalidateCache } from '$lib/server/cache';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionCookie = cookies.get('steam_session');

	if (!sessionCookie) {
		return new Response('Unauthorized', { status: 401 });
	}

	let session: UserSession;
	try {
		session = JSON.parse(sessionCookie);
	} catch {
		return new Response('Invalid session', { status: 401 });
	}

	const type = url.searchParams.get('type') || 'all';
	const forceRefresh = url.searchParams.get('refresh') === 'true';

	// Check cache first (unless force refresh)
	if (type === 'all' && !forceRefresh) {
		const cached = getCachedGames(session.steamId);
		if (cached) {
			// Return cached data as a single event
			const stream = new ReadableStream({
				start(controller) {
					const encoder = new TextEncoder();
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'cached', games: cached.games, total: cached.games.length })}\n\n`));
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', total: cached.games.length })}\n\n`));
					controller.close();
				}
			});

			return new Response(stream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				}
			});
		}
	}

	// Invalidate cache if force refresh
	if (forceRefresh) {
		invalidateCache(session.steamId);
	}

	// Fetch games list
	let games;
	if (type === 'recent') {
		games = await getRecentlyPlayedGames(session.steamId, 50);
	} else {
		games = await getOwnedGames(session.steamId);
		games = games.sort((a, b) => (b.rtime_last_played || 0) - (a.rtime_last_played || 0));
	}

	const totalGames = games.length;
	const allProcessedGames: GameWithCompatibility[] = [];

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			// Send initial count
			controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', total: totalGames })}\n\n`));

			const batchSize = 5;

			for (let i = 0; i < games.length; i += batchSize) {
				const batch = games.slice(i, i + batchSize);

				const batchResults = await Promise.all(
					batch.map(async (game) => {
						const [protondb, platforms] = await Promise.all([
							getProtonDBRating(game.appid),
							getGamePlatforms(game.appid)
						]);

						const isNative = platforms?.linux === true;
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

				allProcessedGames.push(...batchResults);

				// Send batch update
				controller.enqueue(encoder.encode(`data: ${JSON.stringify({
					type: 'batch',
					games: batchResults,
					processed: allProcessedGames.length,
					total: totalGames
				})}\n\n`));

				if (i + batchSize < games.length) {
					// Increased delay to avoid Steam Store API rate limiting
					await delay(500);
				}
			}

			// Cache all results
			if (type === 'all') {
				setCachedGames(session.steamId, allProcessedGames);
			}

			// Send completion event
			controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', total: allProcessedGames.length })}\n\n`));
			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
