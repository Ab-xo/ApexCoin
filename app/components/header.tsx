import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "Overview", href: "/market#overview" },
  { label: "Trending", href: "/market#trending" },
  { label: "Screener", href: "/market#screener" },
  { label: "All coins", href: "/coins" },
];

export function Header() {
  return (
    <header className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-8">
      <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/img/logo.jpg"
            alt="Apex Coin"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <span className="text-base font-semibold tracking-wide">Apex Coin</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/market#screener"
          className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Open screener
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
