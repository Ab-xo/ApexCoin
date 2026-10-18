import { errorResponse } from "@/lib/coingecko";
import { loadMarketData } from "@/lib/market-data";

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
  const order =
    params.get("order") === "volume_desc" ? "volume_desc" : "market_cap_desc";

  if (page === null || !/^(10|25|50|100)$/.test(perPageValue)) {
    return Response.json(
      {
        error:
          "Invalid pagination. Use page 1-1000 and perPage 10, 25, 50, or 100.",
      },
      { status: 400 },
    );
  }

  try {
    const data = await loadMarketData({ page, perPage, query, order });
    return Response.json(data);
  } catch (error) {
    return errorResponse(error);
  }
}
