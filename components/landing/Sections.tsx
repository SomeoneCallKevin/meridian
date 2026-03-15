"use client";

import { useEffect, useRef, ReactNode } from "react";

/* ── Scroll reveal wrapper ── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-8");
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-700 ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── How it works ── */
const steps = [
  { num: "01", title: "Ingest", desc: "News feeds, market data, social signals, and geopolitical events stream in continuously and get deduplicated." },
  { num: "02", title: "Analyze", desc: "AI scores sentiment, maps affected assets, and builds causal reasoning chains through second-order effects." },
  { num: "03", title: "Fuse", desc: "Signals from news, technicals, and geopolitics get weighted into a single confidence score per asset." },
  { num: "04", title: "Decide", desc: "Buy, sell, or hold — with full reasoning, risk parameters, and contrarian arguments so you decide with clarity." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-[120px] border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-8">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-xs font-semibold uppercase tracking-[2px] text-accent-green mb-4">Process</div>
            <h2 className="font-display text-[clamp(36px,4vw,56px)] font-normal tracking-tight leading-[1.1]">
              From noise to signal<br />in seconds
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-4 gap-0 relative max-lg:grid-cols-2 max-lg:gap-8 max-sm:grid-cols-1">
          {/* Dashed connector line */}
          <div className="absolute top-9 left-[8%] right-[8%] h-px max-lg:hidden" style={{ background: "repeating-linear-gradient(90deg, #4E5969 0 4px, transparent 4px 12px)", opacity: 0.3 }} />

          {steps.map((s, i) => (
            <Reveal key={i} className="text-center px-4 relative" delay={i * 100}>
              <div className="w-[72px] h-[72px] rounded-full border border-white/[0.12] bg-surface flex items-center justify-center mx-auto mb-5 relative z-10">
                <span className="font-mono text-2xl font-medium text-accent-green">{s.num}</span>
              </div>
              <h4 className="text-base font-semibold mb-2">{s.title}</h4>
              <p className="text-[13px] text-t-secondary leading-relaxed">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Signal types ── */
const signalTypes = [
  {
    color: "text-accent-green",
    label: "Equities",
    title: "Individual stocks and sectors",
    desc: "Earnings reports, analyst upgrades, executive changes, and regulatory filings — direct impact news scored against technical patterns.",
    tags: ["Earnings", "FDA decisions", "Insider trades", "Sector rotation"],
  },
  {
    color: "text-accent-amber",
    label: "Crypto",
    title: "Bitcoin, Ethereum, and majors",
    desc: "Regulation, ETF flows, on-chain metrics, and social sentiment. Crypto moves on narrative — the NLP engine understands narrative.",
    tags: ["ETF flows", "SEC actions", "Social hype", "Whale moves"],
  },
  {
    color: "text-accent-blue",
    label: "Commodities",
    title: "Oil, gold, and energy",
    desc: "Geopolitical events are the primary driver. OPEC decisions, shipping routes, sanctions — this is where the causal reasoning chain matters most.",
    tags: ["OPEC", "Sanctions", "Supply chains", "Weather events"],
  },
  {
    color: "text-accent-red",
    label: "Macro",
    title: "Rates, inflation, and policy",
    desc: "Fed decisions, CPI prints, employment data. Macro signals affect everything — Meridian traces the cascade to specific positions.",
    tags: ["Fed meetings", "CPI / PPI", "Jobs data", "Yield curve"],
  },
];

export function SignalTypes() {
  return (
    <section id="signals" className="py-[120px] border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-8">
        <Reveal>
          <div className="text-xs font-semibold uppercase tracking-[2px] text-accent-green mb-4">Asset coverage</div>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] font-normal tracking-tight leading-[1.1] mb-5">
            Stocks, crypto, and<br />commodities
          </h2>
          <p className="text-[17px] text-t-secondary max-w-[520px] leading-[1.7] mb-16">
            Every asset class has different signal dynamics. Meridian adapts its analysis to each one.
          </p>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
          {signalTypes.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="bg-card border border-white/[0.06] rounded-xl p-9 transition-all hover:border-white/[0.12] hover:-translate-y-0.5">
                <div className={`text-[11px] font-semibold uppercase tracking-[1.5px] mb-3 ${s.color}`}>{s.label}</div>
                <h3 className="font-display text-[22px] font-normal tracking-tight mb-3">{s.title}</h3>
                <p className="text-sm text-t-secondary leading-relaxed mb-5">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-3 py-1 rounded-full border border-white/[0.06] text-t-secondary">{tag}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats ── */
const stats = [
  { num: "500+", label: "News sources monitored" },
  { num: "<5s", label: "Average signal latency" },
  { num: "24/7", label: "Global market coverage" },
  { num: "4", label: "Independent signal sources" },
];

export function Stats() {
  return (
    <section className="py-[100px] border-t border-b border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-4 gap-8 text-center max-lg:grid-cols-2 max-sm:grid-cols-1">
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="font-display text-[clamp(40px,5vw,64px)] font-normal text-accent-green tracking-tight leading-none mb-2">
                {s.num}
              </div>
              <div className="text-sm text-t-secondary">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ── */
export function CTA() {
  return (
    <section className="py-[140px] text-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(34,214,138,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="relative z-10 max-w-[1200px] mx-auto px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(40px,5vw,64px)] font-normal tracking-tight leading-[1.1] mb-5">
            Stop guessing.
            <br />
            Start <em className="italic text-accent-green">understanding.</em>
          </h2>
          <p className="text-[17px] text-t-secondary max-w-[480px] mx-auto mb-10 leading-[1.7]">
            Join the waitlist for early access. Meridian is currently in private beta with a small group of traders.
          </p>
          <div className="flex justify-center gap-4">
            <button className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-green text-deep text-sm font-semibold rounded-full hover:bg-[#2EE89A] hover:shadow-[0_0_30px_rgba(34,214,138,0.25)] hover:-translate-y-0.5 transition-all">
              Join the waitlist
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-2.5 border border-white/[0.12] text-t-primary text-sm font-medium rounded-full hover:border-t-muted hover:bg-white/[0.03] transition-all">
              Read the docs
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Footer ── */
export function Footer() {
  return (
    <footer className="py-12 border-t border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between max-sm:flex-col max-sm:gap-4">
        <p className="text-[13px] text-t-muted">
          &copy; 2026 Meridian. Not financial advice. Past performance does not guarantee future results.
        </p>
        <div className="flex gap-7">
          {["Privacy", "Terms", "Docs", "Twitter"].map((link) => (
            <a key={link} href="#" className="text-[13px] text-t-muted hover:text-t-secondary transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
