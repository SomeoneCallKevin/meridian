"use client";

import { useState } from "react";
import Link from "next/link";
import { mockSignals, type Signal } from "@/lib/mockData";

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
type SortBy = "confidence" | "urgency" | "recent";

export default function SignalsPage() {
  const [dirFilter, setDirFilter] = useState<FilterDir>("all");
  const [urgFilter, setUrgFilter] = useState<FilterUrg>("all");
  const [sortBy, setSortBy] = useState<SortBy>("confidence");

  let filtered = [...mockSignals];

  if (dirFilter !== "all") {
    filtered = filtered.filter((s) => s.direction === dirFilter);
  }
  if (urgFilter !== "all") {
    filtered = filtered.filter((s) => s.urgency === urgFilter);
  }

  filtered.sort((a, b) => {
    if (sortBy === "confidence") return b.confidence - a.confidence;
    if (sortBy === "urgency") {
      const urgOrder = { high: 0, med: 1, low: 2 };
      return urgOrder[a.urgency] - urgOrder[b.urgency];
    }
    return 0; // recent — already in order
  });

  const buyCount = mockSignals.filter((s) => s.direction === "buy").length;
  const sellCount = mockSignals.filter((s) => s.direction === "sell").length;
  const holdCount = mockSignals.filter((s) => s.direction === "hold").length;

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">All signals</h2>
        <p className="text-sm text-t-muted mt-1">
          {mockSignals.length} active signals across all asset classes
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total signals</div>
          <div className="text-[24px] font-semibold font-mono">{mockSignals.length}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Buy signals</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">{buyCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Sell signals</div>
          <div className="text-[24px] font-semibold font-mono text-accent-red">{sellCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Hold signals</div>
          <div className="text-[24px] font-semibold font-mono text-accent-amber">{holdCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Direction filter */}
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

          {/* Urgency filter */}
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

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-t-muted">Sort by:</span>
            {(["confidence", "urgency", "recent"] as SortBy[]).map((s) => (
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

      {/* Signal table */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        {/* Header row */}
        <div className="grid grid-cols-[60px_70px_1fr_70px_100px_80px_70px] gap-3 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
          <span>Ticker</span>
          <span>Signal</span>
          <span>Reason</span>
          <span>Urgency</span>
          <span>Confidence</span>
          <span>Sources</span>
          <span>Time</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-t-muted text-sm">
            No signals match your filters.
          </div>
        ) : (
          filtered.map((signal) => (
            <Link
              key={signal.id}
              href={`/dashboard/signals/${signal.id}`}
              className="grid grid-cols-[60px_70px_1fr_70px_100px_80px_70px] gap-3 items-center py-3.5 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors no-underline"
            >
              <span className="font-mono font-medium text-[14px] text-t-primary">
                {signal.ticker}
              </span>
              <span>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${dirColors[signal.direction]}`}>
                  {signal.direction}
                </span>
              </span>
              <span className="text-[12px] text-t-secondary truncate">
                {signal.reason}
              </span>
              <span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${urgColors[signal.urgency]}`}>
                  {signal.urgency}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <div className="w-[52px] h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${confBarColors[signal.direction]}`} style={{ width: `${signal.confidence}%` }} />
                </div>
                <span className="text-[12px] font-mono text-t-secondary">{signal.confidence}%</span>
              </div>
              <span className="text-[11px] text-t-muted">
                {signal.sources.length} sources
              </span>
              <span className="text-[11px] text-t-muted">
                {signal.timestamp}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
