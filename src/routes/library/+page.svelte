<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { GameWithCompatibility, OverallPlayability } from '$lib/types';
	import GameCard from '$lib/components/GameCard.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let games: GameWithCompatibility[] = [];
	let loading = true;
	let refreshing = false;
	let error = '';
	let filter: OverallPlayability | 'all' = 'all';
	let sortBy: 'recent' | 'playtime' | 'name' | 'playability' = 'recent';
	let viewMode: 'all' | 'recent' = 'all';
	let searchQuery = '';
	let cached = false;
	let cacheAge: number | null = null;
	let displayCacheAge: number | null = null;
	let cacheTimer: ReturnType<typeof setInterval> | null = null;

	// Progress tracking
	let totalGames = 0;
	let processedGames = 0;
	let isStreaming = false;

	$: progressPercent = totalGames > 0 ? Math.round((processedGames / totalGames) * 100) : 0;

	const playabilityOrder: Record<OverallPlayability, number> = {
		native: 0,
		excellent: 1,
		good: 2,
		medium: 3,
		poor: 4,
		unplayable: 5,
		unknown: 6
	};

	$: filteredGames = games
		.filter((game) => filter === 'all' || game.overallPlayability === filter)
		.filter((game) => !searchQuery || game.name.toLowerCase().includes(searchQuery.toLowerCase()))
		.sort((a, b) => {
			switch (sortBy) {
				case 'recent':
					return (b.rtime_last_played || 0) - (a.rtime_last_played || 0);
				case 'playtime':
					return b.playtime_forever - a.playtime_forever;
				case 'name':
					return a.name.localeCompare(b.name);
				case 'playability':
					return playabilityOrder[a.overallPlayability] - playabilityOrder[b.overallPlayability];
				default:
					return 0;
			}
		});

	$: stats = {
		total: games.length,
		native: games.filter((g) => g.overallPlayability === 'native').length,
		excellent: games.filter((g) => g.overallPlayability === 'excellent').length,
		good: games.filter((g) => g.overallPlayability === 'good').length,
		medium: games.filter((g) => g.overallPlayability === 'medium').length,
		poor: games.filter((g) => g.overallPlayability === 'poor').length,
		unplayable: games.filter((g) => g.overallPlayability === 'unplayable').length,
		unknown: games.filter((g) => g.overallPlayability === 'unknown').length
	};

	$: playableCount = stats.native + stats.excellent + stats.good + stats.medium;
	$: playablePercent = stats.total > 0 ? Math.round((playableCount / stats.total) * 100) : 0;

	function formatCacheAge(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		if (seconds < 3600) {
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${mins}m ${secs}s`;
		}
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		return `${hours}h ${mins}m`;
	}

	function startCacheTimer(initialAge: number) {
		if (cacheTimer) {
			clearInterval(cacheTimer);
		}

		displayCacheAge = initialAge;

		cacheTimer = setInterval(() => {
			if (displayCacheAge !== null) {
				displayCacheAge += 1;
			}
		}, 1000);
	}

	function stopCacheTimer() {
		if (cacheTimer) {
			clearInterval(cacheTimer);
			cacheTimer = null;
		}
		displayCacheAge = null;
	}

	async function loadGames(mode: 'all' | 'recent', forceRefresh = false) {
		if (forceRefresh) {
			refreshing = true;
			games = [];
		} else {
			loading = true;
			games = [];
		}
		error = '';
		cached = false;
		stopCacheTimer();
		totalGames = 0;
		processedGames = 0;
		isStreaming = false;

		try {
			let url = mode === 'recent'
				? '/api/games/stream?type=recent'
				: '/api/games/stream?type=all';

			if (forceRefresh) {
				url += '&refresh=true';
			}

			const response = await fetch(url);
			if (!response.ok) {
				throw new Error('Failed to fetch games');
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Stream not available');
			}

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const jsonStr = line.slice(6);
						try {
							const event = JSON.parse(jsonStr);

							if (event.type === 'start') {
								totalGames = event.total;
								isStreaming = true;
							} else if (event.type === 'batch') {
								games = [...games, ...event.games];
								processedGames = event.processed;
							} else if (event.type === 'cached') {
								games = event.games;
								cached = true;
								startCacheTimer(0);
							} else if (event.type === 'done') {
								isStreaming = false;
							}
						} catch (e) {
							console.error('Failed to parse SSE event:', e);
						}
					}
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
			refreshing = false;
			isStreaming = false;
		}
	}

	function switchView(mode: 'all' | 'recent') {
		if (viewMode !== mode) {
			viewMode = mode;
			loadGames(mode);
		}
	}

	function forceRefresh() {
		loadGames(viewMode, true);
	}

	onMount(async () => {
		if (!data.user) {
			window.location.href = '/';
			return;
		}
		loadGames(viewMode);
	});

	onDestroy(() => {
		stopCacheTimer();
	});
</script>

<svelte:head>
	<title>My Library - Steam Linux Checker</title>
</svelte:head>

<div class="container">
	<div class="page-header">
		<h1>Your Steam Library</h1>
		<div class="header-controls">
			<div class="view-toggle">
				<button
					class="toggle-btn"
					class:active={viewMode === 'all'}
					on:click={() => switchView('all')}
				>
					All Games
				</button>
				<button
					class="toggle-btn"
					class:active={viewMode === 'recent'}
					on:click={() => switchView('recent')}
				>
					Recently Played
				</button>
			</div>
			<button
				class="refresh-btn"
				on:click={forceRefresh}
				disabled={loading || refreshing}
				title="Force refresh data from ProtonDB"
			>
				{#if refreshing}
					<span class="refresh-spinner"></span>
					Refreshing...
				{:else}
					Refresh Data
				{/if}
			</button>
		</div>
	</div>

	{#if cached && displayCacheAge !== null && !loading}
		<div class="cache-notice">
			Cached {formatCacheAge(displayCacheAge)} ago. Click "Refresh Data" to update.
		</div>
	{/if}

	{#if loading && !isStreaming}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading your games...</p>
		</div>
	{:else if isStreaming || (refreshing && totalGames > 0)}
		<div class="loading-progress">
			<div class="progress-header">
				<span>Loading compatibility data...</span>
				<span class="progress-count">{processedGames} / {totalGames} games</span>
			</div>
			<div class="progress-bar-container">
				<div class="progress-bar" style="width: {progressPercent}%"></div>
			</div>
			<p class="progress-percent">{progressPercent}% complete</p>
		</div>
	{:else if error}
		<div class="error card">
			<h3>Error</h3>
			<p>{error}</p>
			<a href="/" class="btn-primary">Go Home</a>
		</div>
	{:else}
		<div class="stats card">
			<div class="stats-header">
				<h2>Compatibility Summary</h2>
				<div class="playable-percent">
					<span class="percent">{playablePercent}%</span>
					<span class="label">Playable on Linux</span>
				</div>
			</div>
			<div class="stats-grid">
				<button
					class="stat-item"
					class:active={filter === 'all'}
					on:click={() => (filter = 'all')}
				>
					<span class="stat-value">{stats.total}</span>
					<span class="stat-label">Total</span>
				</button>
				<button
					class="stat-item native"
					class:active={filter === 'native'}
					on:click={() => (filter = 'native')}
				>
					<span class="stat-value">{stats.native}</span>
					<span class="stat-label">Native</span>
				</button>
				<button
					class="stat-item excellent"
					class:active={filter === 'excellent'}
					on:click={() => (filter = 'excellent')}
				>
					<span class="stat-value">{stats.excellent}</span>
					<span class="stat-label">Excellent</span>
				</button>
				<button
					class="stat-item good"
					class:active={filter === 'good'}
					on:click={() => (filter = 'good')}
				>
					<span class="stat-value">{stats.good}</span>
					<span class="stat-label">Good</span>
				</button>
				<button
					class="stat-item medium"
					class:active={filter === 'medium'}
					on:click={() => (filter = 'medium')}
				>
					<span class="stat-value">{stats.medium}</span>
					<span class="stat-label">Medium</span>
				</button>
				<button
					class="stat-item poor"
					class:active={filter === 'poor'}
					on:click={() => (filter = 'poor')}
				>
					<span class="stat-value">{stats.poor}</span>
					<span class="stat-label">Poor</span>
				</button>
				<button
					class="stat-item unplayable"
					class:active={filter === 'unplayable'}
					on:click={() => (filter = 'unplayable')}
				>
					<span class="stat-value">{stats.unplayable}</span>
					<span class="stat-label">Unplayable</span>
				</button>
				<button
					class="stat-item unknown"
					class:active={filter === 'unknown'}
					on:click={() => (filter = 'unknown')}
				>
					<span class="stat-value">{stats.unknown}</span>
					<span class="stat-label">Unknown</span>
				</button>
			</div>
		</div>

		<div class="controls">
			<div class="control-group">
				<div class="search-control">
					<input
						type="text"
						placeholder="Search games..."
						bind:value={searchQuery}
						class="search-input"
					/>
				</div>
				<div class="sort-control">
					<label for="sort">Sort by:</label>
					<select id="sort" bind:value={sortBy}>
						<option value="recent">Recently Played</option>
						<option value="playtime">Total Playtime</option>
						<option value="name">Name</option>
						<option value="playability">Playability</option>
					</select>
				</div>
			</div>
			<div class="results-count">
				Showing {filteredGames.length} of {games.length} games
			</div>
		</div>

		<div class="games-grid">
			{#each filteredGames as game (game.appid)}
				<GameCard {game} />
			{/each}
		</div>

		{#if filteredGames.length === 0}
			<div class="no-results card">
				<p>No games match the current filter.</p>
				<button on:click={() => (filter = 'all')}>Show all games</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	h1 {
		margin: 0;
	}

	.header-controls {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.view-toggle {
		display: flex;
		gap: 8px;
	}

	.toggle-btn {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		padding: 8px 16px;
		border-radius: 4px;
		font-size: 14px;
		border: 1px solid transparent;
	}

	.toggle-btn:hover {
		color: var(--text-primary);
	}

	.toggle-btn.active {
		background: var(--accent);
		color: var(--bg-primary);
	}

	.refresh-btn {
		background: var(--bg-secondary);
		color: var(--text-primary);
		padding: 8px 16px;
		border-radius: 4px;
		font-size: 14px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.refresh-btn:hover:not(:disabled) {
		background: var(--bg-card);
		border-color: var(--accent);
	}

	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--bg-secondary);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		display: inline-block;
	}

	.cache-notice {
		background: rgba(102, 192, 244, 0.1);
		border: 1px solid rgba(102, 192, 244, 0.3);
		border-radius: 4px;
		padding: 10px 16px;
		margin-bottom: 20px;
		font-size: 14px;
		color: var(--accent);
	}

	.loading {
		text-align: center;
		padding: 60px 20px;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid var(--bg-secondary);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 20px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-progress {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 24px;
		margin-bottom: 24px;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.progress-count {
		color: var(--accent);
		font-weight: 600;
	}

	.progress-bar-container {
		background: var(--bg-secondary);
		border-radius: 4px;
		height: 8px;
		overflow: hidden;
	}

	.progress-bar {
		background: var(--accent);
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-percent {
		text-align: center;
		margin-top: 12px;
		color: var(--text-secondary);
		font-size: 14px;
	}

	.error {
		text-align: center;
	}

	.error h3 {
		color: var(--danger);
		margin-bottom: 12px;
	}

	.btn-primary {
		display: inline-block;
		background: var(--accent);
		color: var(--bg-primary);
		padding: 12px 24px;
		border-radius: 4px;
		font-weight: 600;
		text-decoration: none;
		margin-top: 16px;
	}

	.stats {
		margin-bottom: 24px;
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.stats-header h2 {
		margin: 0;
	}

	.playable-percent {
		text-align: right;
	}

	.playable-percent .percent {
		font-size: 2rem;
		font-weight: bold;
		color: var(--success);
	}

	.playable-percent .label {
		display: block;
		font-size: 14px;
		color: var(--text-secondary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 12px;
	}

	.stat-item {
		background: var(--bg-secondary);
		padding: 16px;
		border-radius: 8px;
		text-align: center;
		cursor: pointer;
		border: 2px solid transparent;
		transition: all 0.2s;
	}

	.stat-item:hover {
		border-color: var(--accent);
	}

	.stat-item.active {
		border-color: var(--accent);
		background: rgba(102, 192, 244, 0.1);
	}

	.stat-value {
		display: block;
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 12px;
		color: var(--text-secondary);
		text-transform: uppercase;
	}

	.stat-value {
		color: white;
	}
	.stat-item.native .stat-value {
		color: #4fc3f7;
	}
	.stat-item.excellent .stat-value {
		color: var(--success);
	}
	.stat-item.good .stat-value {
		color: var(--gold);
	}
	.stat-item.medium .stat-value {
		color: var(--silver);
	}
	.stat-item.poor .stat-value {
		color: var(--bronze);
	}
	.stat-item.unplayable .stat-value {
		color: var(--danger);
	}
	.stat-item.unknown .stat-value {
		color: var(--text-secondary);
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.control-group {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.search-control {
		display: flex;
		align-items: center;
	}

	.search-input {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 14px;
		width: 200px;
	}

	.search-input::placeholder {
		color: var(--text-secondary);
	}

	.sort-control {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sort-control select {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 14px;
	}

	.results-count {
		color: var(--text-secondary);
		font-size: 14px;
	}

	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
	}

	.no-results {
		text-align: center;
		padding: 40px;
	}

	.no-results button {
		background: var(--accent);
		color: var(--bg-primary);
		margin-top: 16px;
	}
</style>
