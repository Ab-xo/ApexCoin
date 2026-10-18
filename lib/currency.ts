export const marketCurrencies = [
  { code: "usd", label: "USD" },
  { code: "eur", label: "EUR" },
  { code: "gbp", label: "GBP" },
  { code: "inr", label: "INR" },
] as const;

export type MarketCurrency = (typeof marketCurrencies)[number]["code"];

export function isMarketCurrency(value: string): value is MarketCurrency {
  return marketCurrencies.some((currency) => currency.code === value);
}
