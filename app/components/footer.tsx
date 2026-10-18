import Link from "next/link";
import Image from "next/image";

const marketNavigation = [
  { label: "Overview", href: "/market#overview" },
  { label: "Trending", href: "/market#trending" },
  { label: "Screener", href: "/market#screener" },
  { label: "All coins", href: "/coins" },
];

const introNavigation = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Explore", href: "#explore" },
];

export function Footer({ variant = "market" }: { variant?: "intro" | "market" }) {
  const isIntro = variant === "intro";
  const navigation = isIntro ? introNavigation : marketNavigation;

  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-8 lg:px-8">
      <div className="flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-wide text-slate-200">
          <Image src="/img/logo.jpg" alt="" width={32} height={32} className="rounded-full object-cover" />
          Apex Coin
        </Link>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
          {navigation.map((item) => isIntro ? (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ) : (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <p>{isIntro ? "Market data provided by CoinGecko. Not financial advice." : "Market data provided by CoinGecko."}</p>
      </div>
    </footer>
  );
}
