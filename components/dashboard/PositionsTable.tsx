"use client";

import { useState, useEffect, useCallback } from "react";
import { usePositions } from "@/lib/usePositions";
import Link from "next/link";

type Quote = { symbol: string; price: number; change: number; changePercent: number };

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "within-limits": { bg: "bg-accent-green/10", text: "text-accent-green", label: "Within limits" },
  "near-stop": { bg: "bg-accent-amber/10", text: "text-accent-amber", label: "Near stop" },
  "stop-triggered": { bg: "bg-accent-red/10", text: "text-accent-red", label: "Stop hit" },
  "take-profit": { bg: "bg-accent-blue/10", text: "text-accent-blue", label: "TP hit" },
};

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(2)}`;
}

function getRiskStatus(pos: { stopLoss: number | null; takeProfit: number | null }, currentPrice: number) {
  if (pos.takeProfit && currentPrice >= pos.takeProfit) return "take-profit";
  if (pos.stopLoss && currentPrice <= pos.stopLoss) return "stop-triggered";
  if (pos.stopLoss) {
    const distPct = ((currentPrice - pos.stopLoss) / currentPrice) * 100;
    if (distPct < 2) return "near-stop";
  }
  return "within-limits";
}

export default function PositionsTable() {
  const { positions } = usePositions();
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

  if (!mounted) {
    return (
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8ECF1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span className="font-semibold text-[15px]">Open positions</span>
        </div>
        <div className="py-8 text-center text-t-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8ECF1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span className="font-semibold text-[15px]">Open positions</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-t-muted">{positions.length} active</span>
          <Link href="/dashboard/positions" className="text-[12px] text-accent-green hover:text-[#2EE89A] no-underline">
            Manage
          </Link>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-t-muted text-sm">No open positions</p>
          <Link href="/dashboard/positions" className="text-[12px] text-accent-green hover:text-[#2EE89A] no-underline mt-1 inline-block">
            Add your first position
          </Link>
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="grid grid-cols-[1fr_90px_90px_70px_90px_100px] gap-2 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
            <span>Asset</span>
            <span>Entry</span>
            <span>Current</span>
            <span>P&L</span>
            <span>Value</span>
            <span>Risk</span>
          </div>

          {/* Rows */}
          {positions.map((pos) => {
            const quote = quotes.get(pos.ticker);
            const currentPrice = quote?.price ?? pos.entryPrice;
            const pnlPct = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
            const marketValue = currentPrice * pos.shares;
            const riskStatus = getRiskStatus(pos, currentPrice);
            const status = statusStyles[riskStatus];
            const isProfitable = pnlPct >= 0;

            return (
              <div
                key={pos.id}
                className="grid grid-cols-[1fr_90px_90px_70px_90px_100px] gap-2 items-center py-3 border-b border-white/[0.06] last:border-b-0 text-[13px]"
              >
                <div>
                  <span className="font-mono font-medium">{pos.ticker}</span>
                  <span className="text-[11px] text-t-muted ml-2">{pos.shares} shares</span>
                </div>
                <span className="text-t-secondary font-mono">{formatPrice(pos.entryPrice)}</span>
                <span className="text-t-primary font-mono">{formatPrice(currentPrice)}</span>
                <span className={`font-mono font-medium ${isProfitable ? "text-accent-green" : "text-accent-red"}`}>
                  {isProfitable ? "+" : ""}{pnlPct.toFixed(1)}%
                </span>
                <span className="text-t-secondary font-mono text-[12px]">{formatPrice(marketValue)}</span>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full inline-flex w-fit ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
