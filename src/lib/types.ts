import type { ProtonDBRating } from './protondb';

export interface GameWithCompatibility {
	appid: number;
	name: string;
	playtime_forever: number;
	playtime_2weeks?: number;
	rtime_last_played?: number;
	img_icon_url: string;
	headerUrl: string;
	protondb: {
		rating: ProtonDBRating | null;
		confidence?: string;
		trendingTier?: ProtonDBRating;
	} | null;
	overallPlayability: OverallPlayability;
}

export type OverallPlayability = 'native' | 'excellent' | 'good' | 'medium' | 'poor' | 'unplayable' | 'unknown';

export interface UserSession {
	steamId: string;
	personaName: string;
	avatar: string;
	profileUrl: string;
}

export function calculateOverallPlayability(
	protonRating: ProtonDBRating | null
): OverallPlayability {
	// Native Linux support
	if (protonRating === 'native') {
		return 'native';
	}

	// Platinum is excellent
	if (protonRating === 'platinum') {
		return 'excellent';
	}

	// Gold rating is good
	if (protonRating === 'gold') {
		return 'good';
	}

	// Silver is medium
	if (protonRating === 'silver') {
		return 'medium';
	}

	// Bronze is poor
	if (protonRating === 'bronze') {
		return 'poor';
	}

	// Borked is unplayable
	if (protonRating === 'borked') {
		return 'unplayable';
	}

	return 'unknown';
}

export function getPlayabilityLabel(playability: OverallPlayability): string {
	const labels: Record<OverallPlayability, string> = {
		native: 'Native - Has native Linux version',
		excellent: 'Excellent - Works perfectly on Linux',
		good: 'Good - Works with minor tweaks',
		medium: 'Medium - Playable with some effort',
		poor: 'Poor - Significant issues',
		unplayable: 'Unplayable - Does not work',
		unknown: 'Unknown - No data available'
	};
	return labels[playability];
}

export function getPlayabilityEmoji(playability: OverallPlayability): string {
	const emojis: Record<OverallPlayability, string> = {
		native: 'N',
		excellent: '+++',
		good: '++',
		medium: '+',
		poor: '-',
		unplayable: 'X',
		unknown: '?'
	};
	return emojis[playability];
}
