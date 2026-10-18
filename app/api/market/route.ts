import { errorResponse } from "@/lib/coingecko";
import { loadMarketData } from "@/lib/market-data";
import { isMarketCurrency } from "@/lib/currency";

const DEFAULT_PER_PAGE = 25;

function parsePage(value: string | null): number | null {
  if (value === null) return 1;
  if (!/^[1-9]\d{0,3}$/.test(value)) return null;
  const page = Number(value);
  return page <= 1000 ? page : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = parsePage(params.get("page"));
  const perPageValue = params.get("perPage") ?? String(DEFAULT_PER_PAGE);
  const perPage = Number(perPageValue);
  const query = (params.get("q") ?? "").trim().slice(0, 100);
  const currencyValue = params.get("currency") ?? "usd";
  const order =
    params.get("order") === "volume_desc" ? "volume_desc" : "market_cap_desc";

  if (
    page === null ||
    !/^(10|25|50|100)$/.test(perPageValue) ||
    !isMarketCurrency(currencyValue)
  ) {
    return Response.json(
      {
        error: "Use page 1-1000, perPage 10, 25, 50, or 100, and currency usd, eur, gbp, or inr.",
      },
      { status: 400 },
    );
  }

  try {
    const data = await loadMarketData({
      page,
      perPage,
      query,
      order,
      currency: currencyValue,
    });
    return Response.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
