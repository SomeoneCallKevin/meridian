"use client";

import { useState, useEffect, useCallback } from "react";
import { usePositions } from "@/lib/usePositions";
import { useSignals } from "@/lib/useSignals";

type Quote = { symbol: string; price: number; change: number; changePercent: number };

function fmt(n: number): string {
  if (Math.abs(n) >= 1000) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${n.toFixed(2)}`;
}

export default function MetricCards() {
  const { positions, closed, count } = usePositions();
  const { signals, generated } = useSignals();
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchQuotes = useCallback(async () => {
    if (positions.length === 0) return;
    const symbols = positions.map((p) => p.ticker).join(",");
    try {
      const res = await fetch(`/api/quotes?symbols=${symbols}`);
      if (!res.ok) return;
      const data = await res.json();
      const map = new Map<string, Quote>();
      for (const q of data.quotes || []) map.set(q.symbol, q);
      setQuotes(map);
    } catch { /* keep existing */ }
  }, [positions]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // Portfolio value from real positions + live prices
  const totalValue = positions.reduce((sum, p) => {
    const price = quotes.get(p.ticker)?.price ?? p.entryPrice;
    return sum + price * p.shares;
  }, 0);

  const totalCost = positions.reduce((sum, p) => sum + p.entryPrice * p.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Profitable count
  const profitable = positions.filter((p) => {
    const price = quotes.get(p.ticker)?.price ?? p.entryPrice;
    return price > p.entryPrice;
  }).length;

  // Signals stats
  const signalCount = generated ? signals.length : 0;
  const highUrgency = signals.filter((s) => s.urgency === "high").length;

  // Win rate from closed trades
  const wins = closed.filter((c) => c.pnl > 0).length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : 0;

  // Use stable placeholder values during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        {["Portfolio value", "Active signals", "Win rate", "Open positions"].map((label) => (
          <div key={label} className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
            <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">{label}</div>
            <div className="text-[24px] font-semibold font-mono tracking-tight">—</div>
            <div className="text-xs mt-1 text-t-secondary">Loading...</div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Portfolio value",
      value: totalValue > 0 ? fmt(totalValue) : "$0.00",
      sub: totalCost > 0
        ? `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)} (${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}%)`
        : "No positions",
      subColor: totalPnl >= 0 ? "text-accent-green" : "text-accent-red",
    },
    {
      label: "Active signals",
      value: String(signalCount),
      sub: generated
        ? highUrgency > 0
          ? `${highUrgency} high urgency`
          : "No high urgency"
        : "Generate to see signals",
      subColor: highUrgency > 0 ? "text-accent-amber" : "text-t-secondary",
    },
    {
      label: "Win rate",
      value: closed.length > 0 ? `${winRate}%` : "—",
      sub: closed.length > 0
        ? `${wins} of ${closed.length} trades`
        : "No closed trades yet",
      subColor: winRate >= 50 ? "text-accent-green" : closed.length > 0 ? "text-accent-red" : "text-t-secondary",
    },
    {
      label: "Open positions",
      value: String(count),
      sub: count > 0
        ? `${profitable} profitable`
        : "Add your first position",
      subColor: profitable > 0 ? "text-accent-green" : "text-t-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4"
        >
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            {m.label}
          </div>
          <div className="text-[24px] font-semibold font-mono tracking-tight">
            {m.value}
          </div>
          <div className={`text-xs mt-1 ${m.subColor}`}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
