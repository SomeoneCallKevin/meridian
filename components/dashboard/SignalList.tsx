"use client";

import { useState } from "react";
import { mockSignals, type Signal } from "@/lib/mockData";
import Link from "next/link";

const tabs = ["All", "Stocks", "Crypto", "Commodities"];

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
  sell: "bg-accent-amber",
  hold: "bg-accent-blue",
};

export default function SignalList() {
  const [activeTab, setActiveTab] = useState("All");

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
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent-red/10 text-accent-red">
          3 new
        </span>
      </div>

      {/* Tabs */}
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

      {/* Signal rows */}
      <div className="flex flex-col">
        {mockSignals.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <Link
      href={`/dashboard/signals/${signal.id}`}
      className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors no-underline"
    >
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
      <span className="text-[11px] text-t-muted min-w-[48px] text-right">
        {signal.timestamp}
      </span>
    </Link>
  );
}
