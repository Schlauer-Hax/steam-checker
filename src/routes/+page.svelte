<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Steam Linux Checker - Check your Steam library's Linux compatibility</title>
</svelte:head>

<div class="container">
	<div class="hero">
		<h1>Check Your Steam Library's Linux Compatibility</h1>
		<p class="subtitle">
			See which games from your Steam library are playable on Linux using data from ProtonDB.
		</p>

		{#if data.user}
			<a href="/library" class="btn-primary">View My Library</a>
		{:else}
			<a href="/api/auth/login" class="btn-steam-large">
				<svg viewBox="0 0 256 259" width="24" height="24" fill="currentColor">
					<path
						d="M127.779 0C60.967 0 5.057 51.716.197 117.646l69.176 28.656c5.934-4.073 13.095-6.47 20.848-6.47 1.392 0 2.764.071 4.114.213l31.064-45.067v-.633c0-29.064 23.62-52.687 52.683-52.687 29.065 0 52.688 23.623 52.688 52.687 0 29.063-23.623 52.683-52.688 52.683h-1.235l-44.297 31.623c.085 1.13.131 2.271.131 3.421 0 21.802-17.724 39.526-39.527 39.526-19.134 0-35.195-13.617-38.818-31.673L2.339 162.8c17.17 54.92 68.582 94.928 129.44 94.928 74.693 0 135.225-60.528 135.225-135.218C267.004 54.825 202.472 0 127.779 0"
					/>
				</svg>
				Sign in with Steam
			</a>
		{/if}
	</div>

	<div class="features">
		<div class="feature card">
			<h3>ProtonDB Ratings</h3>
			<p>
				Get community-sourced compatibility ratings from thousands of Linux gamers. See if games run
				as Platinum, Gold, Silver, Bronze, or are broken.
			</p>
		</div>

		<div class="feature card">
			<h3>Recently Played</h3>
			<p>
				See your last 50 played games with their Linux compatibility status. Quickly identify which
				of your favorite games work on Linux.
			</p>
		</div>
	</div>

	<div class="rating-legend card">
		<h3>Compatibility Ratings</h3>
		<div class="ratings">
			<div class="rating-item">
				<span class="badge rating-native">Native</span>
				<span>Has a native Linux version</span>
			</div>
			<div class="rating-item">
				<span class="badge rating-platinum">Platinum</span>
				<span>Works perfectly out of the box</span>
			</div>
			<div class="rating-item">
				<span class="badge rating-gold">Gold</span>
				<span>Works with minor tweaks</span>
			</div>
			<div class="rating-item">
				<span class="badge rating-silver">Silver</span>
				<span>Works with some issues</span>
			</div>
			<div class="rating-item">
				<span class="badge rating-bronze">Bronze</span>
				<span>Runs with significant issues</span>
			</div>
			<div class="rating-item">
				<span class="badge rating-borked">Borked</span>
				<span>Does not work</span>
			</div>
		</div>
	</div>
</div>

<style>
	.hero {
		text-align: center;
		padding: 60px 20px;
		max-width: 700px;
		margin: 0 auto;
	}

	.hero h1 {
		font-size: 2.5rem;
		margin-bottom: 16px;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: 1.2rem;
		color: var(--text-secondary);
		margin-bottom: 32px;
	}

	.btn-primary {
		display: inline-block;
		background: var(--accent);
		color: var(--bg-primary);
		padding: 14px 32px;
		border-radius: 4px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-primary:hover {
		background: #8dd4fc;
		text-decoration: none;
		transform: translateY(-2px);
	}

	.btn-steam-large {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		background: #171a21;
		color: white;
		padding: 16px 32px;
		border-radius: 4px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-steam-large:hover {
		background: #2a475e;
		text-decoration: none;
		transform: translateY(-2px);
	}

	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin-bottom: 40px;
	}

	.feature h3 {
		color: var(--accent);
		margin-bottom: 12px;
	}

	.feature p {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.rating-legend h3 {
		margin-bottom: 20px;
		color: var(--text-primary);
	}

	.ratings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 12px;
	}

	.rating-item {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.badge {
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 600;
		min-width: 80px;
		text-align: center;
	}
</style>
