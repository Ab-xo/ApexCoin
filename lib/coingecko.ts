import "server-only";

const DEFAULT_BASE_URL = "https://api.coingecko.com/api/v3";
const ALLOWED_HOSTS = new Set(["api.coingecko.com", "pro-api.coingecko.com"]);

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

function getConfiguration() {
  const apiKey = process.env.COINGECKO_API_KEY?.trim();
  if (!apiKey) {
    throw new CoinGeckoError(
      "CoinGecko is not configured. Set COINGECKO_API_KEY in .env.local.",
      503,
    );
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(
      process.env.COINGECKO_BASE_URL?.trim() || DEFAULT_BASE_URL,
    );
  } catch {
    throw new CoinGeckoError(
      "COINGECKO_BASE_URL must be the official CoinGecko API v3 URL.",
      500,
    );
  }
  if (
    baseUrl.protocol !== "https:" ||
    !ALLOWED_HOSTS.has(baseUrl.hostname) ||
    baseUrl.pathname.replace(/\/$/, "") !== "/api/v3" ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new CoinGeckoError(
      "COINGECKO_BASE_URL must be the official CoinGecko API v3 URL.",
      500,
    );
  }

  return {
    apiKey,
    baseUrl,
    apiKeyHeader:
      baseUrl.hostname === "pro-api.coingecko.com"
        ? "x-cg-pro-api-key"
        : "x-cg-demo-api-key",
  };
}

export async function requestCoinGecko(
  endpoint: string,
  params: Record<string, string> = {},
  revalidate = 60,
): Promise<unknown> {
  const { apiKey, apiKeyHeader, baseUrl } = getConfiguration();
  const url = new URL(`${baseUrl.toString().replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);
  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: { [apiKeyHeader]: apiKey },
    next: { revalidate },
  });

  if (!response.ok) {
    const errorPayload: unknown = await response.json().catch(() => null);
    const upstreamMessage =
      isRecord(errorPayload) &&
      isRecord(errorPayload.status) &&
      typeof errorPayload.status.error_message === "string"
        ? errorPayload.status.error_message
        : "";

    if (response.status === 429) {
      throw new CoinGeckoError(
        "CoinGecko rate limit reached. Please wait a moment and try again.",
        429,
      );
    }
    if (response.status === 404) {
      throw new CoinGeckoError("Coin not found on CoinGecko.", 404);
    }
    if (response.status === 401 || response.status === 403) {
      throw new CoinGeckoError(
        "CoinGecko rejected the API key. Check the key and API base URL in .env.local.",
        502,
      );
    }
    if (
      response.status === 400 &&
      upstreamMessage.includes("Demo API key")
    ) {
      throw new CoinGeckoError(
        "This is a CoinGecko Demo API key. Set COINGECKO_BASE_URL to https://api.coingecko.com/api/v3.",
        503,
      );
    }
    throw new CoinGeckoError(
      `CoinGecko request failed with status ${response.status}.`,
      502,
    );
  }

  return response.json() as Promise<unknown>;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof CoinGeckoError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("CoinGecko API request failed", error);
  return Response.json(
    { error: "Could not reach CoinGecko. Please try again shortly." },
    { status: 502 },
  );
}
