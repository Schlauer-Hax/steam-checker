<script lang="ts">
	import type { GameWithCompatibility } from '$lib/types';
	import { getPlayabilityLabel } from '$lib/types';
	import { getRatingLabel } from '$lib/protondb';

	export let game: GameWithCompatibility;

	function formatPlaytime(minutes: number): string {
		if (minutes < 60) {
			return `${minutes}m`;
		}
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (mins === 0) {
			return `${hours}h`;
		}
		return `${hours}h ${mins}m`;
	}

	function formatLastPlayed(timestamp: number | undefined): string {
		if (!timestamp) return 'Never';
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
		if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
		return `${Math.floor(diffDays / 365)} years ago`;
	}

	$: playabilityClass = `playability-${game.overallPlayability}`;
	$: protonRatingClass = game.protondb?.rating ? `rating-${game.protondb.rating}` : 'rating-unknown';
</script>

<div class="game-card {playabilityClass}">
	<div class="game-image">
		<img src={game.headerUrl} alt={game.name} loading="lazy" />
		<div class="playability-indicator {playabilityClass}">
			{game.overallPlayability.toUpperCase()}
		</div>
	</div>

	<div class="game-info">
		<h3 class="game-title">{game.name}</h3>

		<div class="game-stats">
			<span class="stat">
				<span class="stat-icon">&#9203;</span>
				{formatPlaytime(game.playtime_forever)}
			</span>
			<span class="stat">
				<span class="stat-icon">&#128197;</span>
				{formatLastPlayed(game.rtime_last_played)}
			</span>
		</div>

		<div class="compatibility">
			<div class="compat-row">
				<span class="compat-label">ProtonDB:</span>
				{#if game.protondb}
					<span class="badge {protonRatingClass}">
						{game.protondb.rating?.toUpperCase() || 'UNKNOWN'}
					</span>
				{:else}
					<span class="badge rating-unknown">NO DATA</span>
				{/if}
			</div>
		</div>

		<div class="game-links">
			<a
				href="https://www.protondb.com/app/{game.appid}"
				target="_blank"
				rel="noopener"
				class="link"
			>
				ProtonDB
			</a>
			<a
				href="https://store.steampowered.com/app/{game.appid}"
				target="_blank"
				rel="noopener"
				class="link"
			>
				Steam
			</a>
			<a href="https://lutris.net/games?q={encodeURIComponent(game.name)}" target="_blank" rel="noopener" class="link">
				Lutris
			</a>
		</div>
	</div>
</div>

<style>
	.game-card {
		background: var(--bg-card);
		border-radius: 8px;
		overflow: hidden;
		transition: transform 0.2s, box-shadow 0.2s;
		border-left: 4px solid var(--text-secondary);
	}

	.game-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.game-card.playability-native {
		border-left-color: var(--native);
	}
	.game-card.playability-excellent {
		border-left-color: var(--success);
	}
	.game-card.playability-good {
		border-left-color: var(--gold);
	}
	.game-card.playability-medium {
		border-left-color: var(--silver);
	}
	.game-card.playability-poor {
		border-left-color: var(--bronze);
	}
	.game-card.playability-unplayable {
		border-left-color: var(--danger);
	}

	.game-image {
		position: relative;
		width: 100%;
		aspect-ratio: 460 / 215;
		overflow: hidden;
	}

	.game-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.playability-indicator {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: bold;
		background: rgba(0, 0, 0, 0.8);
	}

	.playability-indicator.playability-native {
		color: var(--native);
	}
	.playability-indicator.playability-excellent {
		color: var(--success);
	}
	.playability-indicator.playability-good {
		color: var(--gold);
	}
	.playability-indicator.playability-medium {
		color: var(--silver);
	}
	.playability-indicator.playability-poor {
		color: var(--bronze);
	}
	.playability-indicator.playability-unplayable {
		color: var(--danger);
	}
	.playability-indicator.playability-unknown {
		color: var(--text-secondary);
	}

	.game-info {
		padding: 16px;
	}

	.game-title {
		font-size: 1rem;
		margin: 0 0 12px 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.game-stats {
		display: flex;
		gap: 16px;
		margin-bottom: 12px;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.stat-icon {
		font-size: 12px;
	}

	.compatibility {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
	}

	.compat-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.compat-label {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.badge {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
	}

	.game-links {
		display: flex;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.link {
		font-size: 13px;
		color: var(--accent);
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
