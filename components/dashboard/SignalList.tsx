"use client";

import { useState } from "react";
import { useSignals, type LiveSignal } from "@/lib/useSignals";
import Link from "next/link";

const tabs = ["All", "Buy", "Sell", "Hold"];

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

const confColors: Record<string, string> = {
  buy: "bg-accent-green",
  sell: "bg-accent-red",
  hold: "bg-accent-amber",
};

export default function SignalList() {
  const {
    signals,
    generating,
    generated,
    generateSignals,
    nlpEnabled,
    newsAnalyzing,
    analyzeArticles,
    articleCount,
    analyzedCount,
  } = useSignals();
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? signals
      : signals.filter((s) => s.direction === activeTab.toLowerCase());

  const display = filtered.slice(0, 7);

  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h4l3-9 4 18 3-9h6" />
          </svg>
          <span className="font-semibold text-[15px]">Trade signals</span>
        </div>
        <div className="flex items-center gap-2">
          {generated && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">
              {signals.length} live
            </span>
          )}
        </div>
      </div>

      {/* Generate button */}
      {!generated && (
        <button
          onClick={nlpEnabled ? generateSignals : analyzeArticles}
          disabled={generating || newsAnalyzing}
          className={`w-full mb-4 py-2.5 text-[12px] font-medium rounded-lg border transition-colors ${
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
            ? `Generate signals from ${analyzedCount} analyzed articles`
            : `Analyze ${articleCount} articles + generate signals`}
        </button>
      )}

      {/* Tabs */}
      {generated && (
        <div className="flex gap-0 border-b border-white/[0.06] mb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "text-t-primary font-medium border-t-primary"
                  : "text-t-muted border-transparent hover:text-t-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Signal rows */}
      {generated ? (
        display.length === 0 ? (
          <div className="py-8 text-center text-t-muted text-sm">
            No signals in this category.
          </div>
        ) : (
          <div className="flex flex-col">
            {display.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </div>
        )
      ) : (
        <div className="py-6 text-center text-t-muted text-[12px]">
          Click above to generate live trading signals from AI-analyzed news.
        </div>
      )}

      {/* View all link */}
      {generated && signals.length > 7 && (
        <Link
          href="/dashboard/signals"
          className="block text-center text-[12px] text-accent-green hover:text-[#2EE89A] mt-3 no-underline"
        >
          View all {signals.length} signals
        </Link>
      )}
    </div>
  );
}

function SignalRow({ signal }: { signal: LiveSignal }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
      <span className="font-mono font-medium text-[14px] min-w-[52px] text-t-primary">
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
      <div className="w-[52px] h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${confColors[signal.direction]}`}
          style={{ width: `${signal.confidence}%` }}
        />
      </div>
      {signal.priceData && (
        <span
          className={`text-[11px] font-mono min-w-[52px] text-right ${
            signal.priceData.changePercent >= 0
              ? "text-accent-green"
              : "text-accent-red"
          }`}
        >
          {signal.priceData.changePercent >= 0 ? "+" : ""}
          {signal.priceData.changePercent.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
