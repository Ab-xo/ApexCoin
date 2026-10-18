import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { CoinIcon } from "../components/coin-icon";
import { errorResponse, isRecord } from "@/lib/coingecko";
import { loadCoinList } from "@/lib/market-data";

type SearchParams = Promise<{
  page?: string | string[];
  q?: string | string[];
  order?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getCoinList(params: {
  page: number;
  perPage: number;
  query: string;
  order: "market_cap_desc" | "volume_desc";
}) {
  try {
    const result = await loadCoinList(params);
    return { ...result, error: null };
  } catch (error) {
    const response = errorResponse(error);
    const payload: unknown = await response.json();
    return {
      coins: null,
      hasNextPage: false,
      error:
        isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : "Could not load coin market data.",
    };
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

function pageHref(page: number, query: string, order: string) {
  const params = new URLSearchParams({ page: String(page), order });
  if (query) params.set("q", query);
  return `/coins?${params.toString()}`;
}

async function CoinListResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pageText = firstValue(params.page);
  const parsedPage =
    pageText === undefined
      ? 1
      : /^[1-9]\d{0,3}$/.test(pageText)
        ? Number(pageText)
        : null;
  if (parsedPage === null || parsedPage > 1000) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-400/20 bg-rose-400/5 px-5 py-4 text-sm text-rose-200"
      >
        Choose a page between 1 and 1000.
      </div>
    );
  }
  const page = parsedPage;
  const query = (firstValue(params.q) ?? "").trim().slice(0, 100);
  const order =
    firstValue(params.order) === "volume_desc"
      ? "volume_desc"
      : "market_cap_desc";

  const result = await getCoinList({
    page,
    perPage: 25,
    query,
    order,
  });
  if (result.error || !result.coins) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-400/20 bg-rose-400/5 px-5 py-4 text-sm text-rose-200"
      >
        {result.error ?? "Could not load coin market data."}
      </div>
    );
  }
  const { coins, hasNextPage } = result;

  return (
      <>
        <div className="mb-4 flex flex-col justify-between gap-2 text-sm text-slate-400 sm:flex-row sm:items-center">
          <p>
            {query
              ? `${coins.length} matching assets`
              : "Ranked by market capitalization"}
          </p>
          <p>Page {page} · Market data provided by CoinGecko</p>
        </div>

        {coins.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-slate-900/70">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/[0.06] text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Rank</th>
                  <th className="px-5 py-4 font-medium">Asset</th>
                  <th className="px-5 py-4 text-right font-medium">Price</th>
                  <th className="px-5 py-4 text-right font-medium">24h change</th>
                  <th className="px-5 py-4 text-right font-medium">24h volume</th>
                  <th className="px-5 py-4 text-right font-medium">Market cap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {coins.map((coin) => (
                  <tr key={coin.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4 text-slate-500">
                      {coin.rank === null ? "—" : `#${coin.rank}`}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/coins/${encodeURIComponent(coin.id)}`}
                        className="flex w-fit items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                      >
                        <CoinIcon image={coin.image} name={coin.name} />
                        <span>
                          <span className="block font-medium text-white">{coin.name}</span>
                          <span className="block text-xs text-slate-500">{coin.symbol}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-slate-200">
                      {formatCurrency(coin.price)}
                    </td>
                    <td
                      className={`px-5 py-4 text-right ${
                        (coin.change24h ?? 0) >= 0
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {coin.change24h === null
                        ? "—"
                        : `${coin.change24h > 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatCompactCurrency(coin.volume24h)}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-300">
                      {formatCompactCurrency(coin.marketCap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">No coins found</h2>
            <p className="mt-2 text-sm text-slate-400">
              Try a different name or ticker symbol.
            </p>
          </div>
        )}

        <nav
          aria-label="Coin list pagination"
          className="mt-5 flex items-center justify-between"
        >
          <Link
            href={pageHref(Math.max(1, page - 1), query, order)}
            aria-disabled={page === 1}
            className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.05] ${
              page === 1 ? "pointer-events-none opacity-40" : "text-slate-200"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Link>
          <Link
            href={pageHref(page + 1, query, order)}
            aria-disabled={!hasNextPage}
            className={`inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/[0.05] ${
              !hasNextPage
                ? "pointer-events-none opacity-40"
                : "text-slate-200"
            }`}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </>
  );
}

async function CoinSearchForm({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return (
    <form
      action="/coins"
      method="get"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-slate-900/70 p-4 sm:flex-row"
    >
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          name="q"
          defaultValue={firstValue(params.q) ?? ""}
          placeholder="Search coins by name or ticker"
          aria-label="Search coins by name or ticker"
          className="h-11 w-full rounded-lg border border-white/[0.08] bg-slate-950/60 pl-10 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
        />
      </label>
      <label className="sr-only" htmlFor="coin-order">Sort coins</label>
      <select
        id="coin-order"
        name="order"
        defaultValue={firstValue(params.order) ?? "market_cap_desc"}
        className="h-11 rounded-lg border border-white/[0.08] bg-slate-950 px-3 text-sm text-slate-300 outline-none focus:border-cyan-400/40"
      >
        <option value="market_cap_desc">Market cap</option>
        <option value="volume_desc">Trading volume</option>
      </select>
      <button
        type="submit"
        className="h-11 rounded-lg bg-cyan-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Search
      </button>
    </form>
  );
}

function CoinListFallback() {
  return (
    <div
      aria-label="Loading coins"
      aria-busy="true"
      className="space-y-3"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

export default function CoinsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-2 text-xs text-slate-500">Markets / All coins</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Explore crypto markets
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Search market-ranked assets and open a coin for more details.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mb-6 h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
        }
      >
        <CoinSearchForm searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<CoinListFallback />}>
        <CoinListResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
