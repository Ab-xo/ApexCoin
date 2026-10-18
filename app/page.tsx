import {
  ArrowRight,
  ChevronRight,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Transactions/sec", value: "1.2M" },
  { label: "Network uptime", value: "99.99%" },
  { label: "Avg. fees", value: "$0.0002" },
  { label: "Active wallets", value: "2.4M" },
];

const features = [
  {
    icon: Zap,
    title: "Lightning-fast settlement",
    description:
      "Built for high-throughput payments and instant finality across global markets.",
  },
  {
    icon: ShieldCheck,
    title: "Institutional-grade security",
    description:
      "Robust validation, encrypted custody patterns, and resilient consensus design.",
  },
  {
    icon: Globe2,
    title: "A borderless economy",
    description:
      "Power seamless cross-border transactions for people, businesses, and ecosystems.",
  },
];

const roadmap = [
  "Layered DeFi vaults for yield generation",
  "Multi-chain bridge infrastructure",
  "AI-powered on-chain analytics dashboard",
  "Eco-friendly validator incentives",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%),linear-gradient(180deg,#020817_0%,#0f172a_40%,#020817_100%)] text-slate-50">
      <section className="mx-auto flex max-w-7xl flex-col px-6 pb-20 pt-8 lg:px-8">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-bold text-slate-950">
              A
            </div>
            <span className="text-base font-semibold tracking-wide">Apex Coin</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#network" className="transition hover:text-white">Network</a>
            <a href="#roadmap" className="transition hover:text-white">Roadmap</a>
          </nav>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Launch App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="mt-20 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-200">
              <Sparkles className="h-4 w-4" />
              Next-generation crypto infrastructure
            </div>
            <h1 className="max-w-xl text-5xl font-black tracking-tight text-white md:text-6xl">
              Reimagining digital value for the next era.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Apex Coin combines ultra-fast settlement, robust security, and a
              developer-first ecosystem to power the future of programmable
              finance.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/market"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Get started
                <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href="#roadmap"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Explore roadmap
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-xs text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-400/20 bg-slate-950/80 p-5 shadow-2xl shadow-cyan-500/10">
            <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Portfolio balance</p>
                  <p className="mt-2 text-4xl font-bold text-white">$248,340.42</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                      A
                    </div>
                    <div>
                      <div className="font-semibold">Apex</div>
                      <div className="text-sm text-slate-400">APX</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">42.8 APX</div>
                    <div className="text-sm text-emerald-400">+12.4%</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
                    <span>Network performance</span>
                    <span>95%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Why Apex</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Purpose-built for a digital-first economy.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="network" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Network</p>
            <h3 className="mt-4 text-3xl font-bold text-white">Trusted by builders, merchants, and communities.</h3>
            <p className="mt-4 text-slate-300">
              From instant consumer payments to institutional treasury management, Apex Coin delivers the security and scale modern ecosystems demand.
            </p>
            <div className="mt-6 flex items-center gap-3 text-cyan-200">
              <LockKeyhole className="h-5 w-5" />
              Enterprise-ready security controls
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Validators", value: "2,400+" },
              { label: "Daily volume", value: "$3.8B" },
              { label: "Settlement time", value: "<1s" },
              { label: "Energy efficiency", value: "82%" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-3xl font-bold text-white">{metric.value}</div>
                <div className="mt-2 text-sm text-slate-300">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Roadmap</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Building the tools that power tomorrow’s digital economy.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {roadmap.map((item, index) => (
            <div key={item} className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-300">
                {index + 1}
              </div>
              <p className="text-lg font-medium leading-7 text-slate-100">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="mx-auto max-w-7xl border-t border-white/10 px-6 py-6 text-sm text-slate-500 lg:px-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <span>Apex Coin</span>
          <Link href="/market" className="text-cyan-300 transition hover:text-cyan-200">
            Explore crypto markets
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Portfolio and network figures on this landing page are illustrative.
        </p>
      </footer>
    </main>
  );
}
