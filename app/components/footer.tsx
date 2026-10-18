import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/#overview" },
  { label: "Trending", href: "/#trending" },
  { label: "Screener", href: "/#screener" },
  { label: "All coins", href: "/coins" },
];

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-8 lg:px-8">
      <div className="flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-semibold tracking-wide text-slate-200">
          Apex Coin
        </Link>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Market data provided by CoinGecko.</p>
      </div>
    </footer>
  );
}
