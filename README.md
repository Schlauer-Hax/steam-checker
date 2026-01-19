# Steam Linux Checker

ts is 100% vibe coded ong

A web application that helps Linux gamers check their Steam library's compatibility with Linux using data from [ProtonDB](https://www.protondb.com).

## Features

- **Steam Integration**: Sign in with your Steam account to access your game library
- **ProtonDB Ratings**: View community-sourced compatibility ratings for your games (Platinum, Gold, Silver, Bronze, Borked)
- **Detailed Game Analysis**: Get a comprehensive playability assessment for each game in your library
- **Game Cards**: Browse your library with a card-based interface showing game details and compatibility information

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with TypeScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: CSS
- **Deployment**: Docker support included

## Project Structure

```
src/
├── lib/
│   ├── steam.ts           # Steam Web API integration
│   ├── protondb.ts        # ProtonDB API integration
│   ├── types.ts           # TypeScript interfaces and type definitions
│   ├── components/        # Reusable Svelte components
│   │   └── GameCard.svelte
│   └── server/
│       └── cache.ts       # Server-side caching utilities
├── routes/
│   ├── +layout.svelte     # Root layout component
│   ├── +page.svelte       # Home page with features overview
│   ├── library/           # Game library route
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   └── api/
│       ├── auth/          # Authentication endpoints
│       │   ├── login/
│       │   ├── logout/
│       │   └── callback/
│       └── games/         # Games API endpoints
│           ├── +server.ts
│           └── stream/
├── hooks.server.ts        # Server-side hooks
└── app.html               # HTML template
```

## Getting Started

### Prerequisites

- Node.js 18+ (or use the Docker setup)
- Steam API Key (get one from [Steamworks](https://steamcommunity.com/dev))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file with your Steam API key:
   ```
   STEAM_API_KEY=your_steam_api_key_here
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

The application will be available at `http://localhost:5173`

### Docker Setup

Build and run the application in Docker:

```bash
docker-compose up --build
```

## Available Scripts

- `pnpm dev` - Start development server with hot module reloading
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

## How It Works

1. **User Authentication**: Users sign in using their Steam account via OAuth2
2. **Game Library Fetch**: The app retrieves the user's Steam game library
3. **Compatibility Data**: For each game, the app queries ProtonDB for compatibility information
4. **Playability Assessment**: An overall playability score is calculated based on ProtonDB ratings
5. **Display**: Games are displayed in a card-based interface sorted by playability

## Playability Ratings

Games are rated as:
- **Native**: Native Linux version available
- **Excellent**: Platinum on ProtonDB
- **Good**: Gold on ProtonDB
- **Medium**: Silver on ProtonDB
- **Poor**: Bronze on ProtonDB
- **Unplayable**: Borked on ProtonDB
- **Unknown**: No compatibility data available

## Environment Variables

- `STEAM_API_KEY` - Your Steam Web API key (required)

## License

See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [ProtonDB](https://www.protondb.com) for compatibility ratings
- [Steam Web API](https://developer.steampowered.com/webapi/) for game library access
