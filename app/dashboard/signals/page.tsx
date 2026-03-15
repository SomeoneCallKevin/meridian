"use client";

import { useState } from "react";
import { useSignals, type LiveSignal } from "@/lib/useSignals";

const dirColors: Record<string, string> = {
  buy: "bg-accent-green/10 text-accent-green",
  sell: "bg-accent-red/10 text-accent-red",
  hold: "bg-accent-amber/10 text-accent-amber",
};

const urgColors: Record<string, string> = {
  high: "bg-accent-red/10 text-accent-red",
  med: "bg-accent-amber/10 text-accent-amber",
  low: "bg-accent-blue/10 text-accent-blue",
};

const confBarColors: Record<string, string> = {
  buy: "bg-accent-green",
  sell: "bg-accent-red",
  hold: "bg-accent-amber",
};

type FilterDir = "all" | "buy" | "sell" | "hold";
type FilterUrg = "all" | "high" | "med" | "low";
type SortBy = "confidence" | "urgency" | "sentiment";

export default function SignalsPage() {
  const {
    signals,
    generating,
    generated,
    generateSignals,
    clearSignals,
    nlpEnabled,
    newsAnalyzing,
    analyzeArticles,
    articleCount,
    analyzedCount,
  } = useSignals();

  const [dirFilter, setDirFilter] = useState<FilterDir>("all");
  const [urgFilter, setUrgFilter] = useState<FilterUrg>("all");
  const [sortBy, setSortBy] = useState<SortBy>("confidence");
  const [expanded, setExpanded] = useState<string | null>(null);

  let filtered = [...signals];

  if (dirFilter !== "all") {
    filtered = filtered.filter((s) => s.direction === dirFilter);
  }
  if (urgFilter !== "all") {
    filtered = filtered.filter((s) => s.urgency === urgFilter);
  }

  filtered.sort((a, b) => {
    if (sortBy === "confidence") return b.confidence - a.confidence;
    if (sortBy === "sentiment") return Math.abs(b.sentiment) - Math.abs(a.sentiment);
    if (sortBy === "urgency") {
      const urgOrder = { high: 0, med: 1, low: 2 };
      return urgOrder[a.urgency] - urgOrder[b.urgency];
    }
    return 0;
  });

  const buyCount = signals.filter((s) => s.direction === "buy").length;
  const sellCount = signals.filter((s) => s.direction === "sell").length;
  const holdCount = signals.filter((s) => s.direction === "hold").length;
  const highUrgCount = signals.filter((s) => s.urgency === "high").length;

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Trade signals</h2>
          <p className="text-sm text-t-muted mt-1">
            {generated
              ? `${signals.length} signals generated from ${analyzedCount} AI-analyzed articles`
              : "Generate live signals from AI-analyzed news"}
          </p>
        </div>
        {generated && (
          <button
            onClick={clearSignals}
            className="text-[12px] text-t-muted hover:text-t-secondary px-3 py-1.5 border border-white/[0.08] rounded-lg transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Generate button if not yet generated */}
      {!generated && (
        <button
          onClick={nlpEnabled ? generateSignals : analyzeArticles}
          disabled={generating || newsAnalyzing}
          className={`py-4 text-[14px] font-medium rounded-xl border transition-all ${
            generating || newsAnalyzing
              ? "border-accent-blue/20 bg-accent-blue/5 text-accent-blue"
              : "border-accent-green/20 bg-accent-green/5 text-accent-green hover:bg-accent-green/10"
          }`}
        >
          {newsAnalyzing
            ? "Step 1/2: Analyzing news with Claude AI..."
            : generating
            ? "Step 2/2: Generating trade signals..."
            : nlpEnabled
            ? `Generate live signals from ${analyzedCount} analyzed articles`
            : `Analyze ${articleCount} articles + generate live signals`}
        </button>
      )}

      {generated && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2">
            <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
              <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total</div>
              <div className="text-[24px] font-semibold font-mono">{signals.length}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
              <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Buy</div>
              <div className="text-[24px] font-semibold font-mono text-accent-green">{buyCount}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
              <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Sell</div>
              <div className="text-[24px] font-semibold font-mono text-accent-red">{sellCount}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
              <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Hold</div>
              <div className="text-[24px] font-semibold font-mono text-accent-amber">{holdCount}</div>
            </div>
            <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
              <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">High urgency</div>
              <div className="text-[24px] font-semibold font-mono text-accent-red">{highUrgCount}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-t-muted">Direction:</span>
                {(["all", "buy", "sell", "hold"] as FilterDir[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirFilter(d)}
                    className={`text-[12px] px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      dirFilter === d
                        ? "bg-white/[0.08] text-t-primary font-medium"
                        : "text-t-muted hover:text-t-secondary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-t-muted">Urgency:</span>
                {(["all", "high", "med", "low"] as FilterUrg[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUrgFilter(u)}
                    className={`text-[12px] px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      urgFilter === u
                        ? "bg-white/[0.08] text-t-primary font-medium"
                        : "text-t-muted hover:text-t-secondary"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-t-muted">Sort:</span>
                {(["confidence", "urgency", "sentiment"] as SortBy[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-[12px] px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      sortBy === s
                        ? "bg-white/[0.08] text-t-primary font-medium"
                        : "text-t-muted hover:text-t-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Signal list */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-t-muted text-sm">
                No signals match your filters.
              </div>
            ) : (
              filtered.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  isExpanded={expanded === signal.id}
                  onToggle={() =>
                    setExpanded(expanded === signal.id ? null : signal.id)
                  }
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SignalCard({
  signal,
  isExpanded,
  onToggle,
}: {
  signal: LiveSignal;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      {/* Main row */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 py-4 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
      >
        <span className="font-mono font-medium text-[14px] min-w-[56px] text-t-primary">
          {signal.ticker}
        </span>
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${dirColors[signal.direction]}`}
        >
          {signal.direction}
        </span>
        <span className="text-[12px] text-t-secondary flex-1 truncate">
          {signal.reason}
        </span>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${urgColors[signal.urgency]}`}
        >
          {signal.urgency}
        </span>
        <div className="flex items-center gap-2 min-w-[90px]">
          <div className="w-[52px] h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${confBarColors[signal.direction]}`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <span className="text-[12px] font-mono text-t-secondary">
            {signal.confidence}%
          </span>
        </div>
        {signal.priceData && (
          <span
            className={`text-[11px] font-mono min-w-[56px] text-right ${
              signal.priceData.changePercent >= 0
                ? "text-accent-green"
                : "text-accent-red"
            }`}
          >
            {signal.priceData.changePercent >= 0 ? "+" : ""}
            {signal.priceData.changePercent.toFixed(2)}%
          </span>
        )}
        <span className="text-[12px] text-t-muted min-w-[60px] text-right">
          {signal.sources.length} sources
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-t-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-2 pb-4 -mx-2">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-5">
            <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
              {/* Left: Signal info */}
              <div>
                {/* Sources */}
                <div className="mb-4">
                  <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">
                    Signal sources
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {signal.sources.map((src) => (
                      <span
                        key={src}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-green/10 text-accent-green"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 text-center">
                    <div
                      className={`text-[16px] font-semibold font-mono ${
                        signal.sentiment >= 0
                          ? "text-accent-green"
                          : "text-accent-red"
                      }`}
                    >
                      {signal.sentiment > 0 ? "+" : ""}
                      {signal.sentiment.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-t-muted mt-0.5">
                      Sentiment
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 text-center">
                    <div className="text-[16px] font-semibold font-mono">
                      {signal.confidence}%
                    </div>
                    <div className="text-[10px] text-t-muted mt-0.5">
                      Confidence
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg px-3 py-2.5 text-center">
                    <div className="text-[16px] font-semibold font-mono">
                      {signal.newsCount}
                    </div>
                    <div className="text-[10px] text-t-muted mt-0.5">
                      Articles
                    </div>
                  </div>
                </div>

                {/* Price data */}
                {signal.priceData && (
                  <div className="mb-4">
                    <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">
                      Current price
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[20px] font-semibold font-mono">
                        $
                        {signal.priceData.price >= 1000
                          ? signal.priceData.price.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })
                          : signal.priceData.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-[14px] font-mono font-medium ${
                          signal.priceData.changePercent >= 0
                            ? "text-accent-green"
                            : "text-accent-red"
                        }`}
                      >
                        {signal.priceData.changePercent >= 0 ? "+" : ""}
                        {signal.priceData.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Causal chain + news */}
              <div>
                {/* Causal chain */}
                {signal.causalChain.length > 0 && (
                  <div className="mb-4">
                    <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">
                      Causal reasoning
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {signal.causalChain.map((step, i) => (
                        <div key={i} className="flex gap-2 text-[12px]">
                          <span className="text-t-muted flex-shrink-0">
                            {i + 1}.
                          </span>
                          <span className="text-t-secondary leading-relaxed">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supporting news */}
                {signal.topNews.length > 0 && (
                  <div>
                    <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">
                      Key articles
                    </div>
                    {signal.topNews.map((n, i) => (
                      <div
                        key={i}
                        className="py-2 border-t border-white/[0.04] first:border-t-0"
                      >
                        <div className="text-[12px] text-t-primary leading-snug">
                          {n.headline}
                        </div>
                        <div className="flex gap-2 items-center mt-1 text-[11px] text-t-muted">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              n.sentiment > 0
                                ? "bg-accent-green"
                                : n.sentiment < 0
                                ? "bg-accent-red"
                                : "bg-t-muted"
                            }`}
                          />
                          <span>
                            {n.sentiment > 0 ? "+" : ""}
                            {n.sentiment.toFixed(1)}
                          </span>
                          <span>{n.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
