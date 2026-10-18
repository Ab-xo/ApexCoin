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
  Minus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import {
  isMarketCurrency,
  marketCurrencies,
  type MarketCurrency,
} from "@/lib/currency";
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

type ChartCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

function isChartCandle(value: unknown): value is ChartCandle {
  if (typeof value !== "object" || value === null) return false;
  return (
    "timestamp" in value &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp) &&
    "open" in value &&
    typeof value.open === "number" &&
    Number.isFinite(value.open) &&
    "high" in value &&
    typeof value.high === "number" &&
    Number.isFinite(value.high) &&
    "low" in value &&
    typeof value.low === "number" &&
    Number.isFinite(value.low) &&
    "close" in value &&
    typeof value.close === "number" &&
    Number.isFinite(value.close)
  );
}
type CoinSummary = Pick<
  MarketCoin,
  "id" | "name" | "symbol" | "image" | "rank" | "price" | "change24h" | "marketCap" | "volume24h" | "sparkline"
> & { high24h: number | null; low24h: number | null };

const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y"] as const;
type Timeframe = (typeof timeframes)[number];

const timeframeDays: Record<Timeframe, string> = {
  "1D": "1",
  "1W": "7",
  "1M": "30",
  "3M": "90",
  "6M": "180",
  "1Y": "365",
};

const initialMarketKey = new URLSearchParams({
  page: "1",
  perPage: "25",
  order: "market_cap_desc",
  currency: "usd",
}).toString() + ":0";

function formatPrice(price: number | null, currency: MarketCurrency) {
  if (price === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumSignificantDigits: 8,
  }).format(price);
}

function formatCompactCurrency(value: number | null, currency: MarketCurrency) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAxisPrice(value: number, currency: MarketCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumSignificantDigits: 4,
  }).format(value);
}

function PriceChange({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-500">—</span>;
  const isPositive = value > 0;
  const isNegative = value < 0;
  const ChangeIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        isPositive
          ? "text-emerald-300"
          : isNegative
            ? "text-rose-300"
            : "text-slate-400"
      }`}
    >
      <ChangeIcon aria-hidden="true" className="h-3.5 w-3.5" />
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

function formatCompactNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function MarketChart({
  candles,
  name,
  currency,
}: {
  candles: ChartCandle[];
  name: string;
  currency: MarketCurrency;
}) {
  const chartWidth = 900;
  const chartTop = 20;
  const chartBottom = 244;
  const [view, setView] = useState({ start: 0, end: candles.length - 1 });
  const [cursor, setCursor] = useState<{
    x: number;
    y: number;
    index: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const chartRef = useRef<SVGSVGElement | null>(null);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    start: number;
    end: number;
  } | null>(null);
  const visibleCandles = candles.slice(view.start, view.end + 1);
  const rawHigh = Math.max(...visibleCandles.map(({ high }) => high));
  const rawLow = Math.min(...visibleCandles.map(({ low }) => low));
  const padding = (rawHigh - rawLow || Math.abs(rawHigh) * 0.04 || 1) * 0.08;
  const minPrice = rawLow - padding;
  const maxPrice = rawHigh + padding;
  const priceRange = maxPrice - minPrice;
  const yForPrice = (price: number) =>
    chartBottom - ((price - minPrice) / priceRange) * (chartBottom - chartTop);
  const candleWidth = Math.min(12, (chartWidth / visibleCandles.length) * 0.62);
  const highIndex = visibleCandles.findIndex(({ high }) => high === rawHigh);
  const lowIndex = visibleCandles.findIndex(({ low }) => low === rawLow);
  const xForIndex = (index: number) =>
    visibleCandles.length === 1
      ? chartWidth / 2
      : (index / (visibleCandles.length - 1)) * (chartWidth - candleWidth) +
        candleWidth / 2;
  const hoveredCandle = cursor ? candles[cursor.index] : null;
  const currentCount = view.end - view.start + 1;
  const fullRange = currentCount === candles.length;
  const cursorIndex = cursor
    ? Math.max(view.start, Math.min(view.end, cursor.index))
    : view.start;

  function zoom(factor: number, anchorRatio = 0.5) {
    setCursor(null);
    setView((current) => {
      const total = candles.length;
      const span = current.end - current.start + 1;
      const nextSpan = Math.max(5, Math.min(total, Math.round(span * factor)));
      const anchor = current.start + (span - 1) * anchorRatio;
      let start = Math.round(anchor - (nextSpan - 1) * anchorRatio);
      start = Math.max(0, Math.min(total - nextSpan, start));
      return { start, end: start + nextSpan - 1 };
    });
  }

  function updateCursor(event: ReactPointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(chartWidth, ((event.clientX - bounds.left) / bounds.width) * 1060),
    );
    const y = Math.max(
      chartTop,
      Math.min(
        chartBottom,
        ((event.clientY - bounds.top) / bounds.height) * 270,
      ),
    );
    const ratio = x / chartWidth;
    const index = Math.max(
      view.start,
      Math.min(
        view.end,
        Math.round(view.start + (view.end - view.start) * ratio),
      ),
    );
    setCursor({ x, y, index });
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    updateCursor(event);
    const drag = dragStart.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pixelsPerIndex = bounds.width
      ? (view.end - view.start + 1) / bounds.width
      : 0;
    const shift = Math.round((drag.x - event.clientX) * pixelsPerIndex);
    const span = drag.end - drag.start + 1;
    const start = Math.max(0, Math.min(candles.length - span, drag.start + shift));
    setView({ start, end: start + span - 1 });
  }

  function finishDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    dragStart.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCursor(null);
      const bounds = chart.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 1060;
      const anchorRatio = Math.max(0, Math.min(1, x / chartWidth));
      const factor = event.deltaY < 0 ? 0.8 : 1.25;
      setView((current) => {
        const total = candles.length;
        const span = current.end - current.start + 1;
        const nextSpan = Math.max(5, Math.min(total, Math.round(span * factor)));
        const anchor = current.start + (span - 1) * anchorRatio;
        let start = Math.round(anchor - (nextSpan - 1) * anchorRatio);
        start = Math.max(0, Math.min(total - nextSpan, start));
        return { start, end: start + nextSpan - 1 };
      });
    };

    chart.addEventListener("wheel", handleWheel, { passive: false });
    return () => chart.removeEventListener("wheel", handleWheel);
  }, [candles.length]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-slate-950/40">
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          {hoveredCandle ? (
            <>
              <span className="font-medium text-slate-200">
                {new Intl.DateTimeFormat("en", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(hoveredCandle.timestamp)}
              </span>
              <span className="text-slate-500">O <strong className="font-medium text-slate-300">{formatPrice(hoveredCandle.open, currency)}</strong></span>
              <span className="text-slate-500">H <strong className="font-medium text-emerald-300">{formatPrice(hoveredCandle.high, currency)}</strong></span>
              <span className="text-slate-500">L <strong className="font-medium text-rose-300">{formatPrice(hoveredCandle.low, currency)}</strong></span>
              <span className="text-slate-500">C <strong className="font-medium text-slate-300">{formatPrice(hoveredCandle.close, currency)}</strong></span>
            </>
          ) : (
            <span className="text-slate-500">OHLC · {currency.toUpperCase()}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 hidden text-[10px] text-slate-600 sm:inline">
            Drag to pan · Scroll to zoom
          </span>
          <button
            type="button"
            onClick={() => zoom(0.7)}
            disabled={currentCount <= 5}
            aria-label="Zoom in on chart"
            title="Zoom in"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(1.4)}
            disabled={fullRange}
            aria-label="Zoom out on chart"
            title="Zoom out"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setView({ start: 0, end: candles.length - 1 });
              setCursor(null);
            }}
            disabled={fullRange}
            aria-label="Reset chart zoom"
            title="Reset zoom"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <svg
        ref={chartRef}
        role="img"
        aria-label={`${name} CoinGecko candlestick price chart in ${currency.toUpperCase()}. Move pointer to inspect candles, drag to pan, and scroll to zoom.`}
        viewBox="0 0 1060 270"
        preserveAspectRatio="none"
        className={`h-64 w-full touch-none select-none sm:h-80 ${dragging ? "cursor-grabbing" : "cursor-crosshair"}`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragStart.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            start: view.start,
            end: view.end,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={() => {
          if (!dragStart.current) setCursor(null);
        }}
      >
        {[0, 1, 2, 3, 4].map((tick) => {
          const y = chartTop + ((chartBottom - chartTop) * tick) / 4;
          const price = maxPrice - ((maxPrice - minPrice) * tick) / 4;
          return (
            <g key={tick}>
              <line
                x1="0"
                x2={chartWidth}
                y1={y}
                y2={y}
                stroke="#ffffff"
                strokeOpacity="0.08"
                strokeDasharray="3 7"
              />
              <text
                x="920"
                y={y + 4}
                fill="#64748b"
                fontSize="12"
                textAnchor="start"
              >
                {formatAxisPrice(price, currency)}
              </text>
            </g>
          );
        })}
        {visibleCandles.map((candle, index) => {
          const x = xForIndex(index);
          const openY = yForPrice(candle.open);
          const closeY = yForPrice(candle.close);
          const rising = candle.close >= candle.open;
          const candleColor = rising ? "#34d399" : "#fb7185";
          return (
            <g key={candle.timestamp}>
              <line
                x1={x}
                x2={x}
                y1={yForPrice(candle.high)}
                y2={yForPrice(candle.low)}
                stroke={candleColor}
                strokeWidth="1.5"
              />
              <rect
                x={x - candleWidth / 2}
                y={Math.min(openY, closeY)}
                width={candleWidth}
                height={Math.max(1.5, Math.abs(closeY - openY))}
                fill={candleColor}
                fillOpacity="0.78"
                stroke={candleColor}
                strokeWidth="1"
                rx="1"
              />
            </g>
          );
        })}
        <circle
          cx={xForIndex(highIndex)}
          cy={yForPrice(rawHigh)}
          r="4"
          fill="#34d399"
          stroke="#020817"
          strokeWidth="2"
        >
          <title>High point in visible chart</title>
        </circle>
        <circle
          cx={xForIndex(lowIndex)}
          cy={yForPrice(rawLow)}
          r="4"
          fill="#fb7185"
          stroke="#020817"
          strokeWidth="2"
        >
          <title>Low point in visible chart</title>
        </circle>
        <line
          x1={chartWidth}
          x2={chartWidth}
          y1={chartTop}
          y2={chartBottom}
          stroke="#ffffff"
          strokeOpacity="0.08"
        />
        {cursor && (
          <g pointerEvents="none">
            <line
              x1={cursor.x}
              x2={cursor.x}
              y1={chartTop}
              y2={chartBottom}
              stroke="#cbd5e1"
              strokeOpacity="0.45"
              strokeDasharray="3 4"
            />
            <line
              x1="0"
              x2={chartWidth}
              y1={cursor.y}
              y2={cursor.y}
              stroke="#cbd5e1"
              strokeOpacity="0.35"
              strokeDasharray="3 4"
            />
            <circle
              cx={xForIndex(cursorIndex - view.start)}
              cy={yForPrice(candles[cursorIndex].close)}
              r="4"
              fill="#e2e8f0"
              stroke="#020817"
              strokeWidth="2"
            />
            <rect
              x={chartWidth + 3}
              y={Math.max(chartTop, Math.min(chartBottom - 18, cursor.y - 9))}
              width="150"
              height="18"
              rx="4"
              fill="#0f172a"
            />
            <text
              x={chartWidth + 8}
              y={Math.max(chartTop + 12, Math.min(chartBottom - 6, cursor.y + 4))}
              fill="#e2e8f0"
              fontSize="11"
            >
              {formatPrice(
                maxPrice -
                  ((cursor.y - chartTop) / (chartBottom - chartTop)) *
                    priceRange,
                currency,
              )}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function MarketDashboard({
  initialMarket,
  initialError,
}: {
  initialMarket: MarketResponse | null;
  initialError: string | null;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [currency, setCurrency] = useState<MarketCurrency>("usd");
  const [activeCoinId, setActiveCoinId] = useState("bitcoin");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [order, setOrder] = useState<"market_cap_desc" | "volume_desc">("market_cap_desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [refreshToken, setRefreshToken] = useState(0);
  const [marketState, setMarketState] = useState<{
    key: string;
    currency: MarketCurrency;
    data?: MarketResponse;
    error?: string;
  }>(() => ({
    key: initialMarketKey,
    currency: "usd",
    data: initialMarket ?? undefined,
    error: initialError ?? undefined,
  }));
  const [chartState, setChartState] = useState<{
    key: string;
    candles?: ChartCandle[];
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
      currency === "usd" &&
      refreshToken === 0
    ) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      order,
      currency,
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
          setMarketState({ key: requestKey, currency, data });
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setMarketState({
            key: requestKey,
            currency,
            error: error instanceof Error ? error.message : "Could not load market data.",
          });
        }
      });

    return () => controller.abort();
  }, [page, perPage, order, debouncedSearch, currency, refreshToken]);

  const market =
    marketState?.currency === currency ? marketState.data ?? null : null;
  const marketKey = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    order,
    currency,
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
  const activeChartKey = `${activeCoinIdForChart ?? ""}:${timeframe}:${currency}`;

  useEffect(() => {
    if (!activeCoinIdForChart) return;
    const coinId = activeCoinIdForChart;
    const requestKey = `${coinId}:${timeframe}:${currency}`;
    const controller = new AbortController();

    fetch(
      `/api/market/chart?id=${encodeURIComponent(coinId)}&days=${timeframeDays[timeframe]}&currency=${currency}`,
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
          !("candles" in payload) ||
          !Array.isArray(payload.candles)
        ) {
          throw new Error("CoinGecko returned invalid chart data.");
        }
        const candles = payload.candles.filter(isChartCandle);
        if (candles.length === 0) {
          throw new Error("CoinGecko returned no OHLC chart data for this coin.");
        }
        return candles;
      })
      .then((candles) => {
        if (!controller.signal.aborted) {
          setChartState({ key: requestKey, candles });
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
  }, [activeCoinIdForChart, timeframe, currency]);

  const chartCandles =
    chartState?.key === activeChartKey ? chartState.candles ?? [] : [];
  const chartError =
    chartState?.key === activeChartKey ? chartState.error ?? null : null;
  const chartLoading =
    Boolean(activeAsset) && chartState?.key !== activeChartKey;
  const chartChange =
    chartCandles.length > 1 && chartCandles[0].open !== 0
      ? ((chartCandles[chartCandles.length - 1].close - chartCandles[0].open) /
          chartCandles[0].open) *
        100
      : null;
  const chartHigh =
    chartCandles.length > 0
      ? Math.max(...chartCandles.map(({ high }) => high))
      : null;
  const chartLow =
    chartCandles.length > 0
      ? Math.min(...chartCandles.map(({ low }) => low))
      : null;

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
      value: formatCompactCurrency(market?.global.marketCap ?? null, currency),
      change: market?.global.marketCapChange24h ?? null,
      icon: CircleDollarSign,
    },
    {
      label: "24h trading volume",
      value: formatCompactCurrency(market?.global.volume24h ?? null, currency),
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
            <label className="inline-flex items-center gap-2">
              <span>Currency</span>
              <select
                value={currency}
                onChange={(event) => {
                  if (isMarketCurrency(event.target.value)) {
                    setCurrency(event.target.value);
                  }
                }}
                aria-label="Display currency"
                className="cursor-pointer bg-transparent font-medium text-slate-200 outline-none"
              >
                {marketCurrencies.map(({ code, label }) => (
                  <option key={code} value={code} className="bg-slate-900">
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <span className="mx-1 h-4 border-l border-white/10" aria-hidden="true" />
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
                {change !== null && <PriceChange value={change} />}
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
                <span className="text-sm font-medium text-slate-200">{formatPrice(asset.price, currency)}</span>
                <span className="text-xs"><PriceChange value={asset.change24h} /></span>
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
                <span className="ml-2"><PriceChange value={category.marketCapChange1h} /></span>
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
                    <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">{activeAsset.symbol}/{currency.toUpperCase()}</span>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{formatPrice(activeAsset.price, currency)}</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-white">Coin price history</h2>
                <p className="mt-1 text-sm text-slate-500">Select a coin to view its chart.</p>
              </div>
            )}
            <div role="group" aria-label="Chart time range" className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-white/[0.06] bg-slate-950/50 p-1">
              {timeframes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTimeframe(item)}
                  aria-pressed={timeframe === item}
                  aria-label={`Show ${item} price history`}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition ${timeframe === item ? "bg-emerald-400 font-semibold text-slate-950 shadow-sm shadow-emerald-400/20" : "text-slate-400 hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {activeAsset && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              <div className="inline-flex items-center gap-1.5">
                <span className="text-slate-500">{timeframe} change</span>
                <PriceChange value={chartChange} />
              </div>
              <span className="text-slate-500">
                Range high <strong className="ml-1 font-medium text-emerald-300">{formatPrice(chartHigh, currency)}</strong>
              </span>
              <span className="text-slate-500">
                Range low <strong className="ml-1 font-medium text-rose-300">{formatPrice(chartLow, currency)}</strong>
              </span>
              <span className="text-slate-500">
                24h volume <strong className="ml-1 font-medium text-slate-300">{formatCompactCurrency(activeAsset.volume24h, currency)}</strong>
              </span>
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
            ) : chartCandles.length > 0 ? (
              <>
                <MarketChart
                  key={activeChartKey}
                  candles={chartCandles}
                  name={activeAsset?.name ?? "Coin"}
                  currency={currency}
                />
                <div className="mt-2 flex justify-between text-[10px] text-slate-600 sm:text-xs">
                  {[0, 1, 2, 3, 4].map((position) => {
                    const point = chartCandles[Math.round((chartCandles.length - 1) * (position / 4))];
                    return (
                      <span key={position}>
                        {new Intl.DateTimeFormat("en", {
                          month: timeframe === "1D" ? undefined : "short",
                          day: timeframe === "1D" ? undefined : "numeric",
                          hour: timeframe === "1D" ? "2-digit" : undefined,
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
                  <span className="block text-sm text-slate-200">{formatPrice(asset.price, currency)}</span>
                  <span className="block text-xs"><PriceChange value={asset.change24h} /></span>
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
                  <td className="px-4 py-3.5 text-right font-medium text-slate-200">{formatPrice(asset.price, currency)}</td>
                  <td className="px-4 py-3.5 text-right"><PriceChange value={asset.change24h} /></td>
                  <td className="px-4 py-3.5 text-right text-slate-300">{formatCompactCurrency(asset.volume24h, currency)}</td>
                  <td className="px-4 py-3.5 text-right text-slate-300">{formatCompactCurrency(asset.marketCap, currency)}</td>
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
