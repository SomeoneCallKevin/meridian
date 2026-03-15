"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    ),
    color: "bg-accent-green/10 text-accent-green",
    title: "NLP sentiment engine",
    desc: "Every article scored from -1.0 to +1.0 with full causal reasoning. Not keywords — real comprehension of what news means for your positions.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" /><path d="M12 3a14.5 14.5 0 014 9 14.5 14.5 0 01-4 9M12 3a14.5 14.5 0 00-4 9 14.5 14.5 0 004 9M3 12h18" stroke="currentColor" strokeWidth="1.5" /></svg>
    ),
    color: "bg-accent-blue/10 text-accent-blue",
    title: "Geopolitical reasoning",
    desc: "Second and third-order effects mapped automatically. Sanctions, elections, conflicts — traced through to the assets they actually move.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 17l4-4 4 4 4-8 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    color: "bg-accent-amber/10 text-accent-amber",
    title: "Technical analysis",
    desc: "RSI, MACD, Bollinger Bands, support/resistance — computed in real time. Used as confirmation signals, never in isolation.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.5" /></svg>
    ),
    color: "bg-accent-green/10 text-accent-green",
    title: "Multi-signal fusion",
    desc: "Weighted confidence scoring across all sources. When news, charts, and geopolitics align — that's when you get a high-conviction signal.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    color: "bg-accent-red/10 text-accent-red",
    title: "Risk management",
    desc: "Automatic position sizing, stop-loss levels, correlation warnings, and portfolio exposure tracking. The guardrails you need when conviction is high.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
    color: "bg-accent-blue/10 text-accent-blue",
    title: "Trade journal",
    desc: "Every signal logged with outcome data. See which sources perform best, learn from misses, and refine your strategy over time.",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-8");
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = sectionRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-[120px]" ref={sectionRef}>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-xs font-semibold uppercase tracking-[2px] text-accent-green mb-4">
          Capabilities
        </div>
        <h2 className="font-display text-[clamp(36px,4vw,56px)] font-normal tracking-tight leading-[1.1] mb-5">
          Every signal,
          <br />
          one decision
        </h2>
        <p className="text-[17px] text-t-secondary max-w-[520px] leading-[1.7] mb-16">
          Meridian doesn&apos;t just show you data. It connects the dots between
          news, charts, and world events — then tells you why.
        </p>

        <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card bg-card border border-white/[0.06] rounded-xl p-8 transition-all duration-300 relative overflow-hidden opacity-0 translate-y-8 hover:border-white/[0.12] hover:bg-card-hover hover:-translate-y-1 group"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="text-[17px] font-semibold mb-2.5">{f.title}</h3>
              <p className="text-sm text-t-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
