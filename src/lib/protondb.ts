export type ProtonDBRating = 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending' | 'native';

export interface ProtonDBReport {
	tier: ProtonDBRating;
	confidence: string;
	score: number;
	trendingTier?: ProtonDBRating;
	provisionalTier?: ProtonDBRating;
	bestReportedTier?: ProtonDBRating;
}

const PROTONDB_API_BASE = 'https://www.protondb.com/api/v1/reports';

export async function getProtonDBRating(appid: number): Promise<ProtonDBReport | null> {
	try {
		const response = await fetch(`${PROTONDB_API_BASE}/summaries/${appid}.json`);

		if (!response.ok) {
			if (response.status === 404) {
				return null;
			}
			// Return null for rate limit errors instead of throwing
			if (response.status === 403 || response.status === 429 || response.status === 503) {
				return null;
			}
			throw new Error(`ProtonDB API error: ${response.status}`);
		}

		const data = await response.json();

		// Use provisionalTier or bestReportedTier when tier is pending
		let effectiveTier = data.tier as ProtonDBRating;
		if (effectiveTier === 'pending' && data.provisionalTier) {
			effectiveTier = data.provisionalTier as ProtonDBRating;
		} else if (effectiveTier === 'pending' && data.bestReportedTier) {
			effectiveTier = data.bestReportedTier as ProtonDBRating;
		}

		return {
			tier: effectiveTier,
			confidence: data.confidence || 'low',
			score: data.score || 0,
			trendingTier: data.trendingTier as ProtonDBRating | undefined,
			provisionalTier: data.provisionalTier as ProtonDBRating | undefined,
			bestReportedTier: data.bestReportedTier as ProtonDBRating | undefined
		};
	} catch (error) {
		// Silently return null for network errors
		return null;
	}
}

export async function getProtonDBRatingsBatch(appids: number[]): Promise<Map<number, ProtonDBReport | null>> {
	const results = new Map<number, ProtonDBReport | null>();

	// ProtonDB doesn't have a batch API, so we need to fetch individually
	// We'll do this in parallel with some rate limiting
	const batchSize = 10;
	for (let i = 0; i < appids.length; i += batchSize) {
		const batch = appids.slice(i, i + batchSize);
		const promises = batch.map(async (appid) => {
			const rating = await getProtonDBRating(appid);
			return { appid, rating };
		});

		const batchResults = await Promise.all(promises);
		for (const { appid, rating } of batchResults) {
			results.set(appid, rating);
		}

		// Small delay between batches to avoid rate limiting
		if (i + batchSize < appids.length) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	return results;
}

export function getRatingLabel(rating: ProtonDBRating): string {
	const labels: Record<ProtonDBRating, string> = {
		platinum: 'Platinum - Works perfectly',
		gold: 'Gold - Works with minor tweaks',
		silver: 'Silver - Works with some issues',
		bronze: 'Bronze - Runs with significant issues',
		borked: 'Borked - Does not work',
		pending: 'Pending - Not enough reports',
		native: 'Native - Linux native'
	};
	return labels[rating] || 'Unknown';
}

export function getRatingColor(rating: ProtonDBRating | null): string {
	if (!rating) return 'unknown';
	return rating;
}

export function isPlayable(rating: ProtonDBRating | null): boolean {
	if (!rating) return false;
	return ['platinum', 'gold', 'silver', 'native'].includes(rating);
}

export function getPlayabilityLevel(rating: ProtonDBRating | null): 'excellent' | 'good' | 'medium' | 'poor' | 'unplayable' | 'unknown' {
	if (!rating) return 'unknown';

	switch (rating) {
		case 'native':
		case 'platinum':
			return 'excellent';
		case 'gold':
			return 'good';
		case 'silver':
			return 'medium';
		case 'bronze':
			return 'poor';
		case 'borked':
			return 'unplayable';
		default:
			return 'unknown';
	}
}
