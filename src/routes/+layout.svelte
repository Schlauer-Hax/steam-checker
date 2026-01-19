<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="app">
	<header>
		<div class="container header-content">
			<a href="/" class="logo">
				<h1>Steam Linux Checker</h1>
			</a>
			<nav>
				{#if data.user}
					<a href="/library">My Library</a>
					<div class="user-info">
						<img src={data.user.avatar} alt={data.user.personaName} class="avatar" />
						<span>{data.user.personaName}</span>
						<form method="POST" action="/api/auth/logout" class="logout-form">
							<button type="submit" class="btn-logout">Logout</button>
						</form>
					</div>
				{:else}
					<a href="/api/auth/login" class="btn-steam">
						<svg viewBox="0 0 256 259" width="20" height="20" fill="currentColor">
							<path
								d="M127.779 0C60.967 0 5.057 51.716.197 117.646l69.176 28.656c5.934-4.073 13.095-6.47 20.848-6.47 1.392 0 2.764.071 4.114.213l31.064-45.067v-.633c0-29.064 23.62-52.687 52.683-52.687 29.065 0 52.688 23.623 52.688 52.687 0 29.063-23.623 52.683-52.688 52.683h-1.235l-44.297 31.623c.085 1.13.131 2.271.131 3.421 0 21.802-17.724 39.526-39.527 39.526-19.134 0-35.195-13.617-38.818-31.673L2.339 162.8c17.17 54.92 68.582 94.928 129.44 94.928 74.693 0 135.225-60.528 135.225-135.218C267.004 54.825 202.472 0 127.779 0"
							/>
						</svg>
						Sign in with Steam
					</a>
				{/if}
			</nav>
		</div>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<div class="container">
			<p>
				Data from <a href="https://www.protondb.com" target="_blank" rel="noopener">ProtonDB</a> and
				<a href="https://lutris.net" target="_blank" rel="noopener">Lutris</a>
			</p>
			<p class="disclaimer">
				This site is not affiliated with Valve, ProtonDB, or Lutris.
			</p>
		</div>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: var(--bg-secondary);
		padding: 16px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 16px;
	}

	.logo {
		text-decoration: none;
	}

	.logo h1 {
		font-size: 1.5rem;
		color: var(--text-primary);
		margin: 0;
	}

	nav {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	nav a {
		color: var(--text-primary);
		text-decoration: none;
		transition: color 0.2s;
	}

	nav a:hover {
		color: var(--accent);
		text-decoration: none;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 4px;
	}

	.logout-form {
		display: inline;
	}

	.btn-logout {
		background: transparent;
		color: var(--text-secondary);
		padding: 8px 12px;
		font-size: 14px;
	}

	.btn-logout:hover {
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.1);
	}

	.btn-steam {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #171a21;
		color: white;
		padding: 10px 20px;
		border-radius: 4px;
		font-weight: 500;
		transition: background 0.2s;
	}

	.btn-steam:hover {
		background: #2a475e;
		text-decoration: none;
	}

	main {
		flex: 1;
		padding: 40px 0;
	}

	footer {
		background: var(--bg-secondary);
		padding: 20px 0;
		text-align: center;
		color: var(--text-secondary);
		font-size: 14px;
	}

	footer p {
		margin: 4px 0;
	}

	.disclaimer {
		font-size: 12px;
		opacity: 0.7;
	}
</style>
