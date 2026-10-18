import {
  finiteNumber,
  isRecord,
  requestCoinGecko,
} from "@/lib/coingecko";
import type { MarketCurrency } from "@/lib/currency";

const MAX_SEARCH_RESULTS = 250;

type MarketDataOptions = {
  page: number;
  perPage: number;
  order: "market_cap_desc" | "volume_desc";
  query: string;
  currency: MarketCurrency;
};

export type CoinListOptions = {
  page: number;
  perPage: number;
  order: "market_cap_desc" | "volume_desc";
  query: string;
};

export type CoinListItem = {
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

export type CoinDetails = {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  description: string | null;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  high24h: number | null;
  low24h: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  lastUpdated: string | null;
};

export type ChartPoint = { timestamp: number; price: number };

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function formattedNumber(value: unknown): number | null {
  if (typeof value === "number") return finiteNumber(value);
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMarketCoins(payload: unknown): CoinListItem[] {
  if (!Array.isArray(payload)) {
    throw new Error("CoinGecko returned an invalid market list.");
  }

  return payload.flatMap((value) => {
    if (!isRecord(value)) return [];
    const id = stringValue(value.id);
    const name = stringValue(value.name);
    const symbol = stringValue(value.symbol);
    if (!id || !name || !symbol) return [];

    const sparklineData = isRecord(value.sparkline_in_7d)
      ? value.sparkline_in_7d.price
      : null;

    return [{
      id,
      name,
      symbol: symbol.toUpperCase(),
      image: stringValue(value.image),
      rank: finiteNumber(value.market_cap_rank),
      price: finiteNumber(value.current_price),
      change24h: finiteNumber(value.price_change_percentage_24h),
      marketCap: finiteNumber(value.market_cap),
      volume24h: finiteNumber(value.total_volume),
      high24h: finiteNumber(value.high_24h),
      low24h: finiteNumber(value.low_24h),
      sparkline: Array.isArray(sparklineData)
        ? sparklineData.filter(
            (price): price is number =>
              typeof price === "number" && Number.isFinite(price),
          )
        : [],
    }];
  });
}

export async function loadCoinList({
  page,
  perPage,
  order,
  query,
}: CoinListOptions): Promise<{ coins: CoinListItem[]; hasNextPage: boolean }> {
  let ids: string[] = [];
  if (query) {
    const searchPayload = await requestCoinGecko("search", { query }, 60);
    if (isRecord(searchPayload) && Array.isArray(searchPayload.coins)) {
      ids = searchPayload.coins.flatMap((coin) =>
        isRecord(coin) && typeof coin.id === "string" ? [coin.id] : [],
      );
    }
    if (ids.length === 0) return { coins: [], hasNextPage: false };
  }

  const params: Record<string, string> = {
    vs_currency: "usd",
    order,
    per_page: String(perPage),
    page: String(page),
    sparkline: "false",
    price_change_percentage: "24h",
  };
  if (ids.length > 0) {
    params.ids = ids.slice(0, MAX_SEARCH_RESULTS).join(",");
  }

  const payload = await requestCoinGecko("coins/markets", params, 60);
  const coins = parseMarketCoins(payload);
  return { coins, hasNextPage: coins.length === perPage };
}

export async function loadCoinDetails(id: string): Promise<CoinDetails> {
  const payload = await requestCoinGecko(
    `coins/${encodeURIComponent(id)}`,
    {
      localization: "false",
      tickers: "false",
      market_data: "true",
      community_data: "false",
      developer_data: "false",
      sparkline: "false",
    },
    60,
  );
  if (!isRecord(payload) || !isRecord(payload.market_data)) {
    throw new Error("CoinGecko returned invalid coin details.");
  }

  const marketData = payload.market_data;
  const marketCap = isRecord(marketData.market_cap)
    ? finiteNumber(marketData.market_cap.usd)
    : null;
  const totalVolume = isRecord(marketData.total_volume)
    ? finiteNumber(marketData.total_volume.usd)
    : null;
  const high24h = isRecord(marketData.high_24h)
    ? finiteNumber(marketData.high_24h.usd)
    : null;
  const low24h = isRecord(marketData.low_24h)
    ? finiteNumber(marketData.low_24h.usd)
    : null;
  const currentPrice = isRecord(marketData.current_price)
    ? finiteNumber(marketData.current_price.usd)
    : null;
  const image = isRecord(payload.image)
    ? stringValue(payload.image.large) ?? stringValue(payload.image.small)
    : null;
  const description = isRecord(payload.description)
    ? stringValue(payload.description.en)
    : null;

  if (
    typeof payload.id !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.symbol !== "string"
  ) {
    throw new Error("CoinGecko returned invalid coin identity.");
  }

  return {
    id: payload.id,
    name: payload.name,
    symbol: payload.symbol.toUpperCase(),
    image,
    description,
    rank: finiteNumber(marketData.market_cap_rank),
    price: currentPrice,
    change24h: finiteNumber(marketData.price_change_percentage_24h),
    marketCap,
    volume24h: totalVolume,
    high24h,
    low24h,
    circulatingSupply: finiteNumber(marketData.circulating_supply),
    totalSupply: finiteNumber(marketData.total_supply),
    maxSupply: finiteNumber(marketData.max_supply),
    lastUpdated: stringValue(payload.last_updated),
  };
}

export async function loadCoinPriceChart(id: string): Promise<ChartPoint[]> {
  const payload = await requestCoinGecko(
    `coins/${encodeURIComponent(id)}/market_chart`,
    { vs_currency: "usd", days: "7" },
    60,
  );
  if (!isRecord(payload) || !Array.isArray(payload.prices)) {
    throw new Error("CoinGecko returned invalid chart data.");
  }

  const prices = payload.prices.flatMap((point) => {
    if (!Array.isArray(point) || point.length < 2) return [];
    const timestamp = finiteNumber(point[0]);
    const price = finiteNumber(point[1]);
    return timestamp === null || price === null ? [] : [{ timestamp, price }];
  });
  if (prices.length === 0) {
    throw new Error("CoinGecko returned no chart prices for this coin.");
  }
  return prices;
}

function parseTrending(payload: unknown, currency: MarketCurrency, exchangeRate: number) {
  if (!isRecord(payload)) {
    throw new Error("CoinGecko returned invalid trending data.");
  }

  const trendingCoins = Array.isArray(payload.coins) ? payload.coins : [];
  const trendingCategories = Array.isArray(payload.categories)
    ? payload.categories
    : [];

  return {
    coins: trendingCoins.flatMap((value) => {
      if (!isRecord(value) || !isRecord(value.item)) return [];
      const item = value.item;
      const data = isRecord(item.data) ? item.data : {};
      const change = isRecord(data.price_change_percentage_24h)
        ? data.price_change_percentage_24h
        : {};

      const id = stringValue(item.id);
      const name = stringValue(item.name);
      const symbol = stringValue(item.symbol);
      if (!id || !name || !symbol) return [];

      return [{
        id,
        name,
        symbol: symbol.toUpperCase(),
        image: stringValue(item.large) ?? stringValue(item.thumb),
        rank: finiteNumber(item.market_cap_rank),
        price: scaleValue(data.price, exchangeRate),
        change24h:
          finiteNumber(change[currency]) ?? finiteNumber(change.usd),
        marketCap: scaleValue(data.market_cap, exchangeRate),
        volume24h: scaleValue(data.total_volume, exchangeRate),
      }];
    }),
    categories: trendingCategories.flatMap((value) => {
      if (!isRecord(value)) return [];
      const name = stringValue(value.name);
      if (!name) return [];
      return [{
        name,
        marketCapChange1h: finiteNumber(value.market_cap_1h_change),
        coinsCount: stringValue(value.coins_count),
      }];
    }),
  };
}

function scaleValue(value: unknown, exchangeRate: number): number | null {
  const amount = formattedNumber(value);
  return amount === null ? null : amount * exchangeRate;
}

function parseGlobal(payload: unknown, currency: MarketCurrency) {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("CoinGecko returned invalid global market data.");
  }

  const data = payload.data;
  const marketCap = isRecord(data.total_market_cap)
    ? finiteNumber(data.total_market_cap[currency])
    : null;
  const volume = isRecord(data.total_volume)
    ? finiteNumber(data.total_volume[currency])
    : null;
  const dominance = isRecord(data.market_cap_percentage)
    ? finiteNumber(data.market_cap_percentage.btc)
    : null;

  return {
    marketCap,
    marketCapChange24h:
      finiteNumber(data[`market_cap_change_percentage_24h_${currency}`]) ??
      finiteNumber(data.market_cap_change_percentage_24h_usd),
    volume24h: volume,
    btcDominance: dominance,
    activeCryptocurrencies: finiteNumber(data.active_cryptocurrencies),
  };
}

export async function loadMarketData({
  page,
  perPage,
  order,
  query,
  currency,
}: MarketDataOptions) {
  const [globalPayload, trendingPayload, searchPayload] = await Promise.all([
    requestCoinGecko("global", {}, 60),
    requestCoinGecko("search/trending", {}, 600),
    query ? requestCoinGecko("search", { query }, 60) : Promise.resolve(null),
  ]);

  let coinParams: Record<string, string> = {
    vs_currency: currency,
    order,
    per_page: String(perPage),
    page: String(page),
    sparkline: "true",
    price_change_percentage: "24h",
  };

  if (query) {
    const matchingCoins =
      isRecord(searchPayload) && Array.isArray(searchPayload.coins)
        ? searchPayload.coins.flatMap((coin) =>
            isRecord(coin) && typeof coin.id === "string" ? [coin.id] : [],
          )
        : [];
    const ids = matchingCoins.slice(0, MAX_SEARCH_RESULTS);
    if (ids.length === 0) {
      const global = parseGlobal(globalPayload, currency);
      return {
        global,
        trending: parseTrending(
          trendingPayload,
          currency,
          getExchangeRate(globalPayload, currency),
        ),
        coins: [],
        page,
        perPage,
        hasNextPage: false,
      };
    }
    coinParams = { ...coinParams, ids: ids.join(",") };
  }

  const marketPayload = await requestCoinGecko("coins/markets", coinParams, 60);
  const coins = parseMarketCoins(marketPayload);
  const global = parseGlobal(globalPayload, currency);

  return {
    global,
    trending: parseTrending(
      trendingPayload,
      currency,
      getExchangeRate(globalPayload, currency),
    ),
    coins,
    page,
    perPage,
    hasNextPage: coins.length === perPage,
  };
}

function getExchangeRate(payload: unknown, currency: MarketCurrency): number {
  if (currency === "usd" || !isRecord(payload) || !isRecord(payload.data)) {
    return 1;
  }
  const marketCaps = payload.data.total_market_cap;
  if (!isRecord(marketCaps)) {
    throw new Error("CoinGecko returned no global market cap for currency conversion.");
  }
  const usdMarketCap = finiteNumber(marketCaps.usd);
  const selectedMarketCap = finiteNumber(marketCaps[currency]);
  if (usdMarketCap === null || usdMarketCap <= 0 || selectedMarketCap === null) {
    throw new Error(`CoinGecko returned no ${currency.toUpperCase()} conversion rate.`);
  }
  return selectedMarketCap / usdMarketCap;
}
