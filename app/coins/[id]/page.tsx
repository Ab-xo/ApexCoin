import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CoinIcon } from "../../components/coin-icon";
import { CoinGeckoError, errorResponse, isRecord } from "@/lib/coingecko";
import {
  loadCoinDetails,
  loadCoinPriceChart,
  type ChartPoint,
  type CoinDetails,
} from "@/lib/market-data";

type PageProps = { params: Promise<{ id: string }> };

async function getCoinChart(id: string) {
  try {
    return { prices: await loadCoinPriceChart(id), error: null };
  } catch (error) {
    const response = errorResponse(error);
    const payload: unknown = await response.json();
    return {
      prices: null,
      error:
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : "Could not load price history.",
    };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,100}$/i.test(id)) {
    return { title: "Coin not found | Apex Coin" };
  }
  try {
    const coin = await loadCoinDetails(id);
    return {
      title: `${coin.name} (${coin.symbol}) | Apex Coin`,
      description: `${coin.name} market data, price history, and 24-hour performance.`,
    };
  } catch (error) {
    if (error instanceof CoinGeckoError && error.status === 404) {
      return { title: "Coin not found | Apex Coin" };
    }
    throw error;
  }
}

function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumSignificantDigits: 8,
  }).format(value);
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

function formatSupply(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function PriceChart({ prices, name }: { prices: ChartPoint[]; name: string }) {
  const values = prices.map((point) => point.price);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = prices.map(({ price }, index) => {
    const x = (index / Math.max(prices.length - 1, 1)) * 1000;
    const y = 225 - ((price - min) / range) * 180;
    return `${x},${y}`;
  });
  const polyline = points.join(" ");

  return (
    <svg
      role="img"
      aria-label={`${name} seven-day price history`}
      viewBox="0 0 1000 270"
      preserveAspectRatio="none"
      className="h-64 w-full"
    >
      <defs>
        <linearGradient id="coin-detail-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[35, 90, 145, 200, 250].map((y) => (
        <line
          key={y}
          x1="0"
          x2="1000"
          y1={y}
          y2={y}
          stroke="#ffffff"
          strokeOpacity="0.07"
          strokeDasharray="4 8"
        />
      ))}
      <polygon points={`0,250 ${polyline} 1000,250`} fill="url(#coin-detail-fill)" />
      <polyline
        points={polyline}
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

async function CoinChart({ id, name }: { id: string; name: string }) {
  const result = await getCoinChart(id);
  if (result.error || !result.prices) {
    return (
      <div role="alert" className="py-16 text-center text-sm text-rose-200">
        {result.error ?? "Could not load price history."}
      </div>
    );
  }
  const prices = result.prices;
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change =
    first.price === 0 ? null : ((last.price - first.price) / first.price) * 100;

  return (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">7-day price history</h2>
          {change !== null && (
            <span
              className={`inline-flex items-center gap-1 text-sm ${
                change >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {change > 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
          )}
        </div>
        <PriceChart prices={prices} name={name} />
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          {[first, last].map((point) => (
            <time key={point.timestamp} dateTime={new Date(point.timestamp).toISOString()}>
              {new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(point.timestamp)}
            </time>
          ))}
        </div>
      </>
  );
}

function ChartFallback() {
  return (
    <div
      aria-label="Loading seven-day price history"
      aria-busy="true"
      className="h-64 animate-pulse rounded-xl bg-white/[0.04]"
    />
  );
}

function MarketStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-slate-950/40 p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-2 text-base font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

function CoinDescription({
  description,
  name,
}: {
  description: string | null;
  name: string;
}) {
  if (!description) return null;
  const text = description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-white">About {name}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-400">{text}</p>
    </section>
  );
}

function CoinOverview({ coin }: { coin: CoinDetails }) {
  const stats = [
    ["Market cap", formatCompactCurrency(coin.marketCap)],
    ["24h trading volume", formatCompactCurrency(coin.volume24h)],
    ["24h high", formatCurrency(coin.high24h)],
    ["24h low", formatCurrency(coin.low24h)],
    ["Circulating supply", formatSupply(coin.circulatingSupply)],
    ["Total supply", formatSupply(coin.totalSupply)],
    ["Max supply", formatSupply(coin.maxSupply)],
    ["Market cap rank", coin.rank === null ? "—" : `#${coin.rank}`],
  ] as const;

  return (
    <>
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <CoinIcon image={coin.image} name={coin.name} size="large" />
          <div>
            <p className="text-sm text-slate-400">{coin.symbol} · CoinGecko market data</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {coin.name}
            </h1>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs text-slate-500">Current price</p>
          <p className="mt-1 text-2xl font-semibold text-white">
            {formatCurrency(coin.price)}
          </p>
          {coin.change24h !== null && (
            <p
              className={`mt-1 text-sm ${
                coin.change24h >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {coin.change24h > 0 ? "+" : ""}
              {coin.change24h.toFixed(2)}% over 24 hours
            </p>
          )}
        </div>
      </header>

      <section className="mt-7 rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
        <Suspense fallback={<ChartFallback />}>
          <CoinChart id={coin.id} name={coin.name} />
        </Suspense>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Market statistics</h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <MarketStat key={label} label={label} value={value} />
          ))}
        </dl>
      </section>

      <CoinDescription description={coin.description} name={coin.name} />

      {coin.lastUpdated && (
        <p className="mt-4 text-right text-xs text-slate-600">
          CoinGecko data last updated{" "}
          <time dateTime={coin.lastUpdated}>
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            }).format(new Date(coin.lastUpdated))}{" "}
          </time>
          UTC
        </p>
      )}
    </>
  );
}

function CoinError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-400/20 bg-rose-400/5 px-5 py-4 text-sm text-rose-200"
    >
      {message}
    </div>
  );
}

async function CoinDetailContent({ params }: PageProps) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,100}$/i.test(id)) notFound();

  let coin: CoinDetails | null = null;
  let errorMessage: string | null = null;
  let missing = false;
  try {
    coin = await loadCoinDetails(id);
  } catch (error) {
    if (error instanceof CoinGeckoError && error.status === 404) {
      missing = true;
    } else {
      const response = errorResponse(error);
      const payload: unknown = await response.json();
      errorMessage =
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : "Could not load coin details.";
    }
  }
  if (missing) notFound();
  if (errorMessage || !coin) {
    return <CoinError message={errorMessage ?? "Could not load coin details."} />;
  }
  return <CoinOverview coin={coin} />;
}

export default function CoinPage({ params }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <Link
        href="/coins"
        className="mb-7 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All coins
      </Link>
      <Suspense
        fallback={
          <div
            aria-label="Loading coin details"
            aria-busy="true"
            className="h-[38rem] animate-pulse rounded-2xl bg-white/[0.04]"
          />
        }
      >
        <CoinDetailContent params={params} />
      </Suspense>
    </main>
  );
}
