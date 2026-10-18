import {
  ArrowRight,
  BarChart3,
  ChartNoAxesCombined,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "./components/footer";
import { Header } from "./components/header";

const features = [
  {
    icon: BarChart3,
    title: "Market at a glance",
    description:
      "See global market metrics, trending coins, and category movement together in one dashboard.",
  },
  {
    icon: Search,
    title: "Find the coins you follow",
    description:
      "Search and sort a broad list of crypto assets by market cap or trading volume.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Explore price history",
    description:
      "Open a coin profile to review key market statistics and its recent price chart.",
  },
];

const appHighlights = [
  { number: "01", label: "Market overview", detail: "Global stats and market movement" },
  { number: "02", label: "Trending assets", detail: "See what is gaining attention" },
  { number: "03", label: "Coin profiles", detail: "Compare prices and historical charts" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%)]">
      <Header variant="intro" />
      <main className="flex-1 text-slate-50">
        <section
          id="about"
          className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28"
        >
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
              Crypto markets, made easier to explore
            </div>
            <h1 className="max-w-2xl text-5xl font-black tracking-tight text-white md:text-6xl lg:text-7xl">
              A clearer view of the crypto market.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Apex Coin brings cryptocurrency market data, trending assets, coin search,
              and price history into one straightforward place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/market"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Explore the market
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/coins"
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Browse all coins
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-cyan-500/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <Image
                  src="/img/logo.jpg"
                  alt="Apex Coin"
                  width={56}
                  height={56}
                  className="rounded-full"
                />
                <div>
                  <p className="text-sm text-slate-400">Welcome to</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    Apex Coin Markets
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-5">
                {appHighlights.map((item) => (
                  <div
                    key={item.number}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <span className="text-sm font-semibold text-cyan-300">
                      {item.number}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">
                Market data is provided by CoinGecko and may be delayed.
              </p>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-6 pb-24 lg:px-8"
        >
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Made for discovery
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              The essentials to understand the market.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="explore"
          className="mx-auto max-w-7xl px-6 pb-24 lg:px-8"
        >
          <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-cyan-300/20 bg-gradient-to-r from-cyan-950/70 via-slate-900/80 to-slate-900/70 p-8 md:flex-row md:items-center md:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Start exploring
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Your next market insight starts here.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Explore market information and discover assets at your own pace.
              </p>
            </div>
            <Link
              href="/market"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open market app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer variant="intro" />
    </div>
  );
}
