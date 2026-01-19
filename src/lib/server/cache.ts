import type { GameWithCompatibility } from '$lib/types';

interface CacheEntry {
	games: GameWithCompatibility[];
	timestamp: number;
	totalGames: number;
}

// In-memory cache keyed by Steam ID
const cache = new Map<string, CacheEntry>();

// Cache duration: 1 hour (in milliseconds)
const CACHE_DURATION = 60 * 60 * 1000;

export function getCachedGames(steamId: string): CacheEntry | null {
	const entry = cache.get(steamId);

	if (!entry) {
		return null;
	}

	// Check if cache is expired
	if (Date.now() - entry.timestamp > CACHE_DURATION) {
		cache.delete(steamId);
		return null;
	}

	return entry;
}

export function setCachedGames(steamId: string, games: GameWithCompatibility[]): void {
	cache.set(steamId, {
		games,
		timestamp: Date.now(),
		totalGames: games.length
	});
}

export function invalidateCache(steamId: string): void {
	cache.delete(steamId);
}

export function getCacheInfo(steamId: string): { cached: boolean; age: number | null; totalGames: number | null } {
	const entry = cache.get(steamId);

	if (!entry) {
		return { cached: false, age: null, totalGames: null };
	}

	const age = Date.now() - entry.timestamp;

	if (age > CACHE_DURATION) {
		cache.delete(steamId);
		return { cached: false, age: null, totalGames: null };
	}

	return {
		cached: true,
		age: Math.floor(age / 1000), // age in seconds
		totalGames: entry.totalGames
	};
}
