"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CoinIcon } from "./coin-icon";

type MarketCoin = {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  sparkline: number[];
};

type TrendingCoin = {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
};

export type MarketResponse = {
  global: {
    marketCap: number | null;
    marketCapChange24h: number | null;
    volume24h: number | null;
    btcDominance: number | null;
    activeCryptocurrencies: number | null;
  };
  trending: {
    coins: TrendingCoin[];
    categories: {
      name: string;
      marketCapChange1h: number | null;
      coinsCount: string | null;
    }[];
  };
  coins: MarketCoin[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
};

type ChartPoint = { timestamp: number; price: number };
type CoinSummary = Pick<
  MarketCoin,
  "id" | "name" | "symbol" | "image" | "rank" | "price" | "change24h" | "marketCap" | "volume24h" | "sparkline"
> & { high24h: number | null; low24h: number | null };

const timeframes = ["24H", "7D", "1M", "1Y"] as const;
type Timeframe = (typeof timeframes)[number];

const timeframeDays: Record<Timeframe, string> = {
  "24H": "1",
  "7D": "7",
  "1M": "30",
  "1Y": "365",
};

const initialMarketKey = new URLSearchParams({
  page: "1",
  perPage: "25",
  order: "market_cap_desc",
}).toString() + ":0";

function formatPrice(price: number | null) {
  if (price === null) return "—";
  return price < 1
    ? `$${price.toLocaleString("en-US", { maximumFractionDigits: 8 })}`
    : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCompactNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function MarketChart({ prices, name }: { prices: ChartPoint[]; name: string }) {
  const values = prices.map(({ price }) => price);
  const minPrice = Math.min(...values);
  const range = Math.max(...values) - minPrice || 1;
  const points = prices.map(({ price }, index) => {
    const x = (index / Math.max(prices.length - 1, 1)) * 1000;
    const y = 225 - ((price - minPrice) / range) * 180;
    return { x, y };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `0,250 ${line} 1000,250`;

  return (
    <svg
      role="img"
      aria-label={`${name} historical CoinGecko price chart`}
      viewBox="0 0 1000 270"
      preserveAspectRatio="none"
      className="h-56 w-full overflow-visible sm:h-72"
    >
      <defs>
        <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[35, 90, 145, 200, 250].map((y) => (
        <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#ffffff" strokeOpacity="0.07" strokeDasharray="4 8" />
      ))}
      <polygon points={area} fill="url(#chart-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function MarketDashboard({
  initialMarket,
  initialError,
}: {
  initialMarket: MarketResponse | null;
  initialError: string | null;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("24H");
  const [activeCoinId, setActiveCoinId] = useState("bitcoin");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [order, setOrder] = useState<"market_cap_desc" | "volume_desc">("market_cap_desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [refreshToken, setRefreshToken] = useState(0);
  const [marketState, setMarketState] = useState<{
    key: string;
    data?: MarketResponse;
    error?: string;
  }>(() => ({
    key: initialMarketKey,
    data: initialMarket ?? undefined,
    error: initialError ?? undefined,
  }));
  const [chartState, setChartState] = useState<{
    key: string;
    prices?: ChartPoint[];
    error?: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(["bitcoin", "ethereum"]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (
      page === 1 &&
      perPage === 25 &&
      order === "market_cap_desc" &&
      debouncedSearch === "" &&
      refreshToken === 0
    ) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      order,
    });
    if (debouncedSearch) params.set("q", debouncedSearch);

    const requestKey = `${params.toString()}:${refreshToken}`;
    fetch(`/api/market?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Could not load market data.";
          throw new Error(message);
        }
        return payload as MarketResponse;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setMarketState({ key: requestKey, data });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setMarketState({
            key: requestKey,
            error: error instanceof Error ? error.message : "Could not load market data.",
          });
        }
      });

    return () => controller.abort();
  }, [page, perPage, order, debouncedSearch, refreshToken]);

  const market = marketState?.data ?? null;
  const marketKey = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    order,
    ...(debouncedSearch ? { q: debouncedSearch } : {}),
  }).toString() + `:${refreshToken}`;
  const marketError =
    marketState?.key === marketKey ? marketState.error ?? null : null;
  const marketLoading = marketState?.key !== marketKey;

  useEffect(() => {
    const refreshInterval = window.setInterval(
      () => setRefreshToken((value) => value + 1),
      60_000,
    );
    return () => window.clearInterval(refreshInterval);
  }, []);

  const allCoins = useMemo(() => {
    if (!market) return [];
    const byId = new Map<string, CoinSummary>();
    for (const coin of market.coins) byId.set(coin.id, coin);
    for (const coin of market.trending.coins) {
      if (!byId.has(coin.id)) {
        byId.set(coin.id, {
          ...coin,
          high24h: null,
          low24h: null,
          sparkline: [],
        });
      }
    }
    return Array.from(byId.values());
  }, [market]);

  const activeAsset = allCoins.find((coin) => coin.id === activeCoinId) ?? null;
  const watchlist = allCoins.filter((coin) => favorites.includes(coin.id));
  const activeCoinIdForChart = activeAsset?.id;
  const activeChartKey = `${activeCoinIdForChart ?? ""}:${timeframe}`;

  useEffect(() => {
    if (!activeCoinIdForChart) return;
    const coinId = activeCoinIdForChart;
    const requestKey = `${coinId}:${timeframe}`;
    const controller = new AbortController();

    fetch(
      `/api/market/chart?id=${encodeURIComponent(coinId)}&days=${timeframeDays[timeframe]}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Could not load coin chart.";
          throw new Error(message);
        }
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("prices" in payload) ||
          !Array.isArray(payload.prices)
        ) {
          throw new Error("CoinGecko returned invalid chart data.");
        }
        return payload.prices as ChartPoint[];
      })
      .then((prices) => {
        if (!controller.signal.aborted) {
          setChartState({ key: requestKey, prices });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setChartState({
            key: requestKey,
            error: error instanceof Error ? error.message : "Could not load coin chart.",
          });
        }
      });

    return () => controller.abort();
  }, [activeCoinIdForChart, timeframe]);

  const chartPrices =
    chartState?.key === activeChartKey ? chartState.prices ?? [] : [];
  const chartError =
    chartState?.key === activeChartKey ? chartState.error ?? null : null;
  const chartLoading =
    Boolean(activeAsset) && chartState?.key !== activeChartKey;

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favorite) => favorite !== id)
        : [...current, id],
    );
  }

  const overviewStats = [
    {
      label: "Total market cap",
      value: formatCompactCurrency(market?.global.marketCap ?? null),
      change: market?.global.marketCapChange24h ?? null,
      icon: CircleDollarSign,
    },
    {
      label: "24h trading volume",
      value: formatCompactCurrency(market?.global.volume24h ?? null),
      change: null,
      icon: BarChart3,
    },
    {
      label: "BTC dominance",
      value:
        market?.global.btcDominance === null || market?.global.btcDominance === undefined
          ? "—"
          : `${market.global.btcDominance.toFixed(2)}%`,
      change: null,
      icon: Activity,
    },
    {
      label: "Active cryptocurrencies",
      value: formatCompactNumber(market?.global.activeCryptocurrencies ?? null),
      change: null,
      icon: CircleDollarSign,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-8 text-slate-100 sm:px-6 lg:px-8">
      <section id="overview" aria-labelledby="overview-heading">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
              <span>Markets</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200">Overview</span>
            </div>
            <h1 id="overview-heading" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Market overview
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Track the crypto market and find your next opportunity.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            <span className={`h-2 w-2 rounded-full ${marketError ? "bg-rose-400" : "bg-emerald-400"}`} />
            {marketError ? "Market data unavailable" : "CoinGecko market data"}
            <button
              type="button"
              onClick={() => setRefreshToken((value) => value + 1)}
              aria-label="Refresh market data"
              className="ml-1 rounded p-0.5 transition hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${marketLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {marketError && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">
            {marketError} Check your server-only CoinGecko configuration, then retry.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map(({ label, value, change, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{label}</p>
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
                {change !== null && (
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="trending" aria-label="Featured assets" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Trending assets</h2>
          <span className="text-xs text-slate-500">Trending on CoinGecko</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(market?.trending.coins ?? []).slice(0, 4).map((asset) => (
            <Link
              key={asset.id}
              href={`/coins/${encodeURIComponent(asset.id)}`}
              className={`rounded-2xl border bg-slate-900/70 p-4 text-left transition hover:border-cyan-400/30 ${activeCoinId === asset.id ? "border-cyan-400/30" : "border-white/[0.08]"}`}
            >
              <span className="sr-only">View {asset.name} details</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CoinIcon image={asset.image} name={asset.name} />
                  <div>
                    <p className="text-sm font-semibold text-white">{asset.symbol}</p>
                    <p className="text-xs text-slate-500">{asset.name}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">{formatPrice(asset.price)}</span>
                <span className={`text-xs font-medium ${(asset.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {asset.change24h === null ? "—" : `${asset.change24h > 0 ? "+" : ""}${asset.change24h.toFixed(2)}%`}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-slate-500">Trending categories</span>
          {(market?.trending.categories ?? []).slice(0, 5).map((category) => (
            <span key={category.name} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
              {category.name}
              {category.marketCapChange1h !== null && (
                <span className={`ml-2 ${category.marketCapChange1h >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {category.marketCapChange1h > 0 ? "+" : ""}{category.marketCapChange1h.toFixed(2)}%
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <article className="min-w-0 rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {activeAsset ? (
              <div className="flex items-center gap-3">
                <CoinIcon
                  image={activeAsset.image}
                  name={activeAsset.name}
                  size="large"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{activeAsset.name}</h2>
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">{activeAsset.symbol}/USD</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{formatPrice(activeAsset.price)}</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-white">Coin price history</h2>
                <p className="mt-1 text-sm text-slate-500">Select a coin to view its chart.</p>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-slate-950/50 p-1">
              {timeframes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTimeframe(item)}
                  aria-pressed={timeframe === item}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition ${timeframe === item ? "bg-cyan-400/15 font-medium text-cyan-200" : "text-slate-400 hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {activeAsset && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <span className="text-slate-500">24h high <strong className="ml-1 font-medium text-slate-300">{formatPrice(activeAsset.high24h)}</strong></span>
              <span className="text-slate-500">24h low <strong className="ml-1 font-medium text-slate-300">{formatPrice(activeAsset.low24h)}</strong></span>
              <span className="text-slate-500">Volume <strong className="ml-1 font-medium text-slate-300">{formatCompactCurrency(activeAsset.volume24h)}</strong></span>
            </div>
          )}

          <div className="mt-4" aria-live="polite">
            {chartLoading ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500 sm:h-72">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Loading CoinGecko price history…
              </div>
            ) : chartError ? (
              <div role="alert" className="flex h-56 items-center justify-center text-center text-sm text-rose-200 sm:h-72">
                {chartError}
              </div>
            ) : chartPrices.length > 0 ? (
              <>
                <MarketChart prices={chartPrices} name={activeAsset?.name ?? "Coin"} />
                <div className="mt-2 flex justify-between text-[10px] text-slate-600 sm:text-xs">
                  {[0, 1, 2, 3, 4].map((position) => {
                    const point = chartPrices[Math.round((chartPrices.length - 1) * (position / 4))];
                    return (
                      <span key={position}>
                        {new Intl.DateTimeFormat("en", {
                          month: timeframe === "24H" ? undefined : "short",
                          day: timeframe === "24H" ? undefined : "numeric",
                          hour: timeframe === "24H" ? "2-digit" : undefined,
                        }).format(point.timestamp)}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex h-56 items-center justify-center text-sm text-slate-500 sm:h-72">
                No chart data available for this coin.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Your watchlist</h2>
              <p className="mt-1 text-xs text-slate-500">{favorites.length} assets tracked</p>
            </div>
            <button type="button" aria-label="Watchlist updates every minute" className="rounded-lg border border-white/[0.08] p-2 text-slate-400">
              <Clock3 className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 space-y-1">
            {watchlist.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => setActiveCoinId(asset.id)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <span className="flex items-center gap-3">
                  <CoinIcon image={asset.image} name={asset.name} />
                  <span>
                    <span className="block text-sm font-medium text-white">{asset.symbol}</span>
                    <span className="block text-xs text-slate-500">{asset.name}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm text-slate-200">{formatPrice(asset.price)}</span>
                  <span className={`block text-xs ${(asset.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {asset.change24h === null ? "—" : `${asset.change24h > 0 ? "+" : ""}${asset.change24h.toFixed(2)}%`}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {activeAsset && (
            <button
              type="button"
              onClick={() => toggleFavorite(activeAsset.id)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
            >
              <Star className={`h-4 w-4 ${favorites.includes(activeAsset.id) ? "fill-amber-300 text-amber-300" : ""}`} />
              {favorites.includes(activeAsset.id) ? `Remove ${activeAsset.symbol} from watchlist` : `Add ${activeAsset.symbol} to watchlist`}
            </button>
          )}
        </article>
      </section>

      <section id="screener" className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/70">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Market screener</h2>
              <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">COINGECKO</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Live market rankings, prices, and 24-hour performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assets"
                aria-label="Search assets by name or ticker"
                className="h-9 w-full rounded-lg border border-white/[0.08] bg-slate-950/60 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
              />
            </label>
            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] px-3 text-sm text-slate-300">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Sort coins</span>
              <select
                value={order}
                onChange={(event) => {
                  setOrder(event.target.value as "market_cap_desc" | "volume_desc");
                  setPage(1);
                }}
                aria-label="Sort coins"
                className="bg-transparent text-sm text-slate-300 outline-none"
              >
                <option value="market_cap_desc" className="bg-slate-900">Market cap</option>
                <option value="volume_desc" className="bg-slate-900">Trading volume</option>
              </select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-right font-medium">24h change</th>
                <th className="px-4 py-3 text-right font-medium">24h volume</th>
                <th className="px-4 py-3 text-right font-medium">Market cap</th>
                <th className="px-6 py-3 text-right font-medium">Watch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {(market?.coins ?? []).map((asset) => (
                <tr
                  key={asset.id}
                  className={`transition hover:bg-white/[0.03] ${activeCoinId === asset.id ? "bg-cyan-400/[0.03]" : ""}`}
                >
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/coins/${encodeURIComponent(asset.id)}`}
                      onClick={() => setActiveCoinId(asset.id)}
                      className="flex items-center gap-3 text-left"
                    >
                      <CoinIcon image={asset.image} name={asset.name} />
                      <span>
                        <span className="block font-medium text-white">{asset.name}</span>
                        <span className="block text-xs text-slate-500">{asset.symbol}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-200">{formatPrice(asset.price)}</td>
                  <td className={`px-4 py-3.5 text-right font-medium ${(asset.change24h ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {asset.change24h === null ? "—" : `${asset.change24h > 0 ? "+" : ""}${asset.change24h.toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-300">{formatCompactCurrency(asset.volume24h)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-300">{formatCompactCurrency(asset.marketCap)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      aria-label={`${favorites.includes(asset.id) ? "Remove" : "Add"} ${asset.name} ${favorites.includes(asset.id) ? "from" : "to"} watchlist`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleFavorite(asset.id);
                      }}
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-amber-300"
                    >
                      <Star className={`h-4 w-4 ${favorites.includes(asset.id) ? "fill-amber-300 text-amber-300" : ""}`} />
                    </button>
                  </td>
                </tr>
              ))}
              {marketLoading && (market?.coins.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Loading live market data…
                    </span>
                  </td>
                </tr>
              )}
              {!marketLoading && !marketError && (market?.coins.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    No assets match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Page {page} · {perPage} coins per page · updated by CoinGecko</span>
          <div className="flex items-center gap-2">
            <label className="mr-2 flex items-center gap-2">
              Rows
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value));
                  setPage(1);
                }}
                aria-label="Coins per page"
                className="rounded-md border border-white/[0.08] bg-slate-950 px-2 py-1 text-slate-200"
              >
                {[10, 25, 50, 100].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1 || marketLoading}
              className="rounded-lg border border-white/[0.08] px-3 py-2 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!market?.hasNextPage || marketLoading}
              className="rounded-lg border border-white/[0.08] px-3 py-2 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <p className="mt-5 text-center text-xs text-slate-600">
        Market information provided by CoinGecko. Prices and market data may be delayed and are not investment advice.
      </p>
    </main>
  );
}
