# Apex Coin: Next Phase Plan

## Product direction

Grow the current market overview into a read-only crypto market terminal
inspired by the CoinPulse tutorial project. Users should be able to discover
coins, inspect a selected coin's price history and market details, and see
clearly labeled live data where the CoinGecko plan supports it. This project
does not execute trades.

## Reference review

The reference repository and deployment were reviewed on 2026-10-18:

- [Tutorial source repository](https://github.com/jsmastery-pro/crypto)
- [Deployed CoinPulse application](https://crypto-zeta-one.vercel.app/)
- [Tutorial video](https://youtu.be/-vsh_GxC-vg)

The deployment currently presents a Bitcoin overview chart with selectable
periods, trending coins, and an All Coins route. The source repository also
contains:

- Independent Suspense boundaries and skeleton fallbacks for dashboard
  sections.
- Search/command-palette navigation and paginated coin discovery.
- Coin detail routes with OHLC candlestick charts, a currency converter,
  gainers/losers, and market information.
- An optional CoinGecko WebSocket hook for prices, trades, and pool OHLCV.

Use these as product and architecture references, not as code to copy
wholesale. In particular, the reference WebSocket hook reads a `NEXT_PUBLIC_`
API key in the browser; Apex Coin must not expose its CoinGecko secret that
way.

## Apex Coin today

- Next.js App Router with a Suspense fallback and server-streamed initial
  market data.
- Server-only CoinGecko API credentials and market, trending, and chart routes.
- Search, sorting, pagination, chart ranges, and a session-only watchlist.
- CoinGecko coin images across the dashboard with a neutral image fallback.
- Searchable `/coins` discovery with pagination and shareable `/coins/[id]`
  asset pages showing market statistics and a streamed seven-day history chart.

## Phased roadmap

### Phase 1 — Coin discovery and asset pages

**Outcome:** Visitors can find a coin and open a shareable details page.

- Add `/coins` with server-side CoinGecko market pagination and clear sort,
  loading, empty, and error states.
- Add `/coins/[id]` with validated CoinGecko IDs, coin image/name/symbol,
  market stats, and responsive detail layout.
- Make trending cards, screener rows, search results, and watchlist entries
  link to the same canonical asset page.
- Add keyboard-accessible search/command palette navigation.
- Keep independent dashboard areas behind their own Suspense boundaries so
  slow categories or trending data do not block the market overview.

**Acceptance:** A visitor can navigate from search, trending, or the coin table
to a valid shareable details URL; invalid IDs and upstream errors have
intentional not-found/error states; each dashboard section can load
independently.

### Phase 2 — Asset analysis and personal watchlist

**Outcome:** Visitors can inspect an asset and keep a consistent list of
favorites.

- Add a responsive OHLC candlestick chart to the asset page with documented
  periods and appropriate CoinGecko endpoint granularity.
- Show asset market statistics and a simple, clearly labeled fiat converter
  using the selected asset's fetched price data.
- Add a persistent browser watchlist keyed by CoinGecko coin IDs, with
  consistent add/remove behavior in discovery and detail views.
- Include empty, loading, unavailable-data, and retry states for the chart and
  watchlist.

**Acceptance:** The selected coin, chart, converter, and watchlist all refer to
the same CoinGecko asset; reloads preserve favorites; changing coin or period
never leaves stale chart data on screen.

### Phase 3 — Optional real-time market feed

**Outcome:** Add a clearly labeled real-time mode only if the CoinGecko account
and subscription support the required WebSocket channels.

- First verify plan entitlements, channel availability, quotas, and deployment
  requirements; REST polling remains the supported baseline.
- Define exactly which fields are live (for example price, pool trades, or
  pool OHLCV), their source, and update timestamp. Do not call delayed REST
  cache data "real-time".
- If WebSocket authentication uses a secret, keep the secret server-side and
  use a protected server-side relay or another approved credential flow. Never
  place a secret in `NEXT_PUBLIC_*`, browser code, or client-visible URLs.
- Implement subscription cleanup, reconnect/backoff, heartbeat handling,
  payload validation, stale-connection indication, and REST fallback.
- Limit subscriptions to the currently selected asset/pool and respect
  provider quotas.

**Acceptance:** Live mode clearly indicates connected/stale/disconnected
status; reconnects safely; falls back to REST; leaves no API secrets in client
assets or browser requests; and is only enabled for verified eligible plans.

### Phase 4 — Reliability and release

**Outcome:** The dashboard can be maintained and deployed with confidence.

- Add focused tests for payload parsing, API input validation, pagination,
  asset routes, watchlist persistence, and chart state.
- Check keyboard operation, accessible image names, responsive layouts, and
  reduced motion.
- Verify loading and error boundaries, caching windows, rate-limit messaging,
  and server-only environment configuration.
- Run lint, type-check, production build, and production smoke tests for
  streaming and key user journeys.
- Document environment variables, CoinGecko plan requirements, and deployment
  setup.

**Acceptance:** All checks pass; the production build streams the shell and
data as intended; and an operator can configure and deploy the app from the
documentation.

## Recommended milestone order

1. **Next milestone:** Complete Phase 1 with keyboard-accessible global search
   and test coverage for discovery/details.
2. **Following milestone:** Phase 2 — selectable chart ranges, converter, and
   persistent watchlist.
3. **Optional milestone:** Phase 3 — verified WebSocket real-time mode.
4. **Release gate:** Phase 4 — automated checks and deployment readiness.

Keep each milestone read-only and focused. Defer transactions, wallets, and
trade execution unless the product scope is explicitly changed.
