# Apex Coin

Apex Coin is a responsive cryptocurrency market screener. Its homepage displays CoinGecko global market statistics, trending coins and categories, historical price charts, a watchlist, and a paginated coin market table.

## Built with

- [Next.js](https://nextjs.org) App Router and React
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) CLI configuration using Base UI and the Nova preset
- [Lucide](https://lucide.dev/) icons
- [Geist](https://vercel.com/font) fonts

## Getting started

### Prerequisites

- Node.js 20.18.1 or newer
- npm
- A CoinGecko Demo or Pro API key

### Configure CoinGecko

Copy `.env.example` to `.env.local`, then add your CoinGecko API key:

```dotenv
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your_coingecko_demo_or_pro_api_key
```

Keep the API key in `COINGECKO_API_KEY` (without the `NEXT_PUBLIC_` prefix). The key is sent by server-side API routes and is never included in browser requests. For a Pro key, use `https://pro-api.coingecko.com/api/v3` as the base URL.

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```text
app/
  api/market/   Server-side CoinGecko market, trending, and chart endpoints
  coins/        Searchable market list and shareable coin detail routes
  components/   Shared site header, footer, interactive dashboard, and stream fallback
  globals.css   Tailwind imports, theme tokens, and global styles
  layout.tsx    Root layout, metadata, and Geist fonts
  page.tsx      Suspense-streamed market dashboard entry point
lib/
  coingecko.ts  Server-only CoinGecko API client
  market-data.ts Shared server-side CoinGecko market and coin data loaders
  utils.ts      Shared `cn` class-name utility
```

## shadcn/ui

The project’s shadcn configuration is in [`components.json`](./components.json). To add a component while connected to the shadcn registry, run:

```bash
npx shadcn add button
```

Replace `button` with the component you want to add. Adding registry components requires internet access.

## Market data

Market data is provided by [CoinGecko](https://www.coingecko.com/en/api). The dashboard streams a skeleton immediately while its initial market data loads on the server. Interactive searches and paginated coin lists continue to use the server-side API route, while market statistics and trending discovery are cached according to CoinGecko's update cadence. Data may be delayed and is not investment advice.

## Roadmap

See the [next-phase plan](./docs/next-phase-plan.md) for the proposed watchlist, asset-inspection, reliability, and release milestones.

## Production build

```bash
npm run build
npm run start
```
