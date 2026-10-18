import {
  errorResponse,
  finiteNumber,
  isRecord,
  requestCoinGecko,
} from "@/lib/coingecko";

const allowedDays = new Set(["1", "7", "30", "365"]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const days = params.get("days") ?? "1";

  if (!/^[a-z0-9-]{1,100}$/i.test(id) || !allowedDays.has(days)) {
    return Response.json(
      { error: "A valid CoinGecko coin ID and chart range are required." },
      { status: 400 },
    );
  }

  try {
    const payload = await requestCoinGecko(
      `coins/${encodeURIComponent(id)}/market_chart`,
      { vs_currency: "usd", days },
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

    return Response.json({ prices });
  } catch (error) {
    return errorResponse(error);
  }
}
