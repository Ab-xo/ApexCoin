# Apex Coin

Apex Coin is a read-only cryptocurrency market dashboard for tracking global
market activity and exploring individual assets. It combines CoinGecko market
data with a searchable screener, selectable fiat currencies, and an OHLC
candlestick chart.

> Market data is informational and may be delayed. Apex Coin does not provide
> financial advice or execute trades.

## Features

- Market overview with global market capitalization, trading volume, and BTC
  dominance.
- Trending assets and categories with clear positive/negative market movement.
- Searchable, sortable, paginated cryptocurrency screener.
- Shareable coin detail pages with market statistics and price history.
- Interactive candlestick chart with 1-day, 1-week, 1-month, 3-month, 6-month,
  and 1-year ranges.
- USD, EUR, GBP, and INR price display.
- Responsive layouts, streaming loading states, and CoinGecko coin imagery.

## Technology

| Area | Technology |
| --- | --- |
| Framework | Next.js App Router |
| UI | React, TypeScript, Tailwind CSS v4 |
| Components | Base UI, shadcn/ui configuration |
| Icons and fonts | Lucide, Geist |
| Market data | CoinGecko API |
| Package manager | npm |

### Languages and configuration

- **TypeScript** — application, API routes, and server-side data integration.
- **CSS** — global styles and Tailwind CSS utility styling.
- **JSON** — package manifest, lockfile, and UI configuration.

## Application routes

| Route | Description |
| --- | --- |
| `/` | Apex Coin introduction |
| `/market` | Streaming market overview and dashboard |
| `/coins` | Searchable coin screener |
| `/coins/[id]` | Coin market details and price history |

## Getting started

### Requirements

- Node.js 20.18.1 or newer
- npm
- A CoinGecko Demo or Pro API key

### Configure the API

Copy `.env.example` to `.env.local` and set your CoinGecko API key:

```dotenv
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=your_coingecko_demo_or_pro_api_key
```

For a Pro API key, use `https://pro-api.coingecko.com/api/v3` as the base URL.
Keep the key in `COINGECKO_API_KEY`; do not add the `NEXT_PUBLIC_` prefix.
Requests to CoinGecko are made by the server.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Check TypeScript types |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |

## Market data

CoinGecko supplies market listings, global statistics, trending assets, and
coin price history. The dashboard requests chart data in the selected fiat
currency. API credentials stay on the server. Data availability, freshness,
and request limits depend on the CoinGecko API plan.
