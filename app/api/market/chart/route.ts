import {
  errorResponse,
  finiteNumber,
  requestCoinGecko,
} from "@/lib/coingecko";
import { isMarketCurrency } from "@/lib/currency";

const allowedDays = new Set(["1", "7", "30", "90", "180", "365"]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const days = params.get("days") ?? "1";
  const currency = params.get("currency") ?? "usd";

  if (
    !/^[a-z0-9-]{1,100}$/i.test(id) ||
    !allowedDays.has(days) ||
    !isMarketCurrency(currency)
  ) {
    return Response.json(
      { error: "A valid CoinGecko coin ID, chart range, and currency are required." },
      { status: 400 },
    );
  }

  try {
    const payload = await requestCoinGecko(
      `coins/${encodeURIComponent(id)}/ohlc`,
      { vs_currency: currency, days },
      60,
    );

    if (!Array.isArray(payload)) {
      throw new Error("CoinGecko returned invalid chart data.");
    }

    const candles = payload.flatMap((point) => {
      if (!Array.isArray(point) || point.length < 5) return [];
      const timestamp = finiteNumber(point[0]);
      const open = finiteNumber(point[1]);
      const high = finiteNumber(point[2]);
      const low = finiteNumber(point[3]);
      const close = finiteNumber(point[4]);
      return timestamp === null ||
        open === null ||
        high === null ||
        low === null ||
        close === null
        ? []
        : [{ timestamp, open, high, low, close }];
    });

    if (candles.length === 0) {
      throw new Error("CoinGecko returned no OHLC chart data for this coin.");
    }

    return Response.json({ candles });
  } catch (error) {
    return errorResponse(error);
  }
}
