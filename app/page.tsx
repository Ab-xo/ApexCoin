import { Suspense } from "react";
import { io } from "next/cache";
import { MarketDashboard } from "./components/market-dashboard";
import { MarketDashboardSkeleton } from "./components/market-dashboard-skeleton";
import { errorResponse, isRecord } from "@/lib/coingecko";
import { loadMarketData } from "@/lib/market-data";

async function StreamingMarketDashboard() {
  await io();

  let initialMarket: Awaited<ReturnType<typeof loadMarketData>> | null = null;
  let initialError: string | null = null;

  try {
    initialMarket = await loadMarketData({
      page: 1,
      perPage: 25,
      order: "market_cap_desc",
      query: "",
    });
  } catch (error) {
    const response = errorResponse(error);
    const payload: unknown = await response.json();
    initialError =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "Could not load market data.";
  }

  return (
    <MarketDashboard
      initialMarket={initialMarket}
      initialError={initialError}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<MarketDashboardSkeleton />}>
      <StreamingMarketDashboard />
    </Suspense>
  );
}
