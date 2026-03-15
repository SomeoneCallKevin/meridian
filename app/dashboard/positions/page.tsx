"use client";

import { mockPositions } from "@/lib/mockData";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "within-limits": { bg: "bg-accent-green/10", text: "text-accent-green", label: "Within limits" },
  "near-stop": { bg: "bg-accent-amber/10", text: "text-accent-amber", label: "Near stop-loss" },
  "stop-triggered": { bg: "bg-accent-red/10", text: "text-accent-red", label: "Stop triggered" },
};

function formatPrice(price: number): string {
  if (price >= 10000) return `$${price.toLocaleString()}`;
  return `$${price.toFixed(2)}`;
}

export default function PositionsPage() {
  const totalValue = 48230;
  const todayPnl = 1157.52;
  const todayPct = 2.4;
  const profitable = mockPositions.filter((p) => p.pnl > 0).length;
  const atRisk = mockPositions.filter((p) => p.riskStatus !== "within-limits").length;

  // Portfolio allocation mock
  const allocations = [
    { sector: "Technology", pct: 32, color: "bg-accent-blue" },
    { sector: "Energy", pct: 24, color: "bg-accent-amber" },
    { sector: "Crypto", pct: 28, color: "bg-accent-green" },
    { sector: "Cash", pct: 16, color: "bg-t-muted" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Positions</h2>
        <p className="text-sm text-t-muted mt-1">
          Your open positions and portfolio overview
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Portfolio value</div>
          <div className="text-[24px] font-semibold font-mono">${totalValue.toLocaleString()}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Today&apos;s P&L</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">
            +${todayPnl.toLocaleString()} ({todayPct}%)
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Profitable</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">
            {profitable}/{mockPositions.length}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">At risk</div>
          <div className={`text-[24px] font-semibold font-mono ${atRisk > 0 ? "text-accent-amber" : "text-accent-green"}`}>
            {atRisk}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 max-lg:grid-cols-1">
        {/* Positions table */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="text-[15px] font-semibold mb-4">Open positions</div>

          <div className="grid grid-cols-[1fr_90px_90px_80px_100px_120px] gap-2 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
            <span>Asset</span>
            <span>Entry</span>
            <span>Current</span>
            <span>P&L</span>
            <span>Signal basis</span>
            <span>Risk status</span>
          </div>

          {mockPositions.map((pos) => {
            const status = statusStyles[pos.riskStatus];
            const isProfitable = pos.pnl >= 0;
            const valueChange = pos.current - pos.entry;

            return (
              <div
                key={pos.ticker}
                className="grid grid-cols-[1fr_90px_90px_80px_100px_120px] gap-2 items-center py-4 border-b border-white/[0.06] last:border-b-0 text-[13px] hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-mono font-medium text-[14px]">{pos.ticker}</span>
                  <div className="text-[11px] text-t-muted mt-0.5">
                    {isProfitable ? "+" : ""}{formatPrice(valueChange)} per unit
                  </div>
                </div>
                <span className="text-t-secondary">{formatPrice(pos.entry)}</span>
                <span className="text-t-primary font-medium">{formatPrice(pos.current)}</span>
                <span className={`font-mono font-medium ${isProfitable ? "text-accent-green" : "text-accent-red"}`}>
                  {isProfitable ? "+" : ""}{pos.pnl}%
                </span>
                <span className="text-t-muted text-[12px]">{pos.signalBasis}</span>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full inline-flex w-fit ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sidebar: Allocation + Risk */}
        <div className="flex flex-col gap-6">
          {/* Allocation */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Portfolio allocation</div>

            {/* Visual bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {allocations.map((a) => (
                <div
                  key={a.sector}
                  className={`${a.color}`}
                  style={{ width: `${a.pct}%` }}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3">
              {allocations.map((a) => (
                <div key={a.sector} className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${a.color}`} />
                    <span className="text-t-secondary">{a.sector}</span>
                  </div>
                  <span className="font-mono font-medium">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk warnings */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Risk alerts</div>

            <div className="flex flex-col gap-3">
              <RiskAlert
                level="warning"
                title="ETH approaching stop-loss"
                detail="Current: $3,380 | Stop: $3,350 (-0.9% away)"
              />
              <RiskAlert
                level="danger"
                title="TSLA stop-loss triggered"
                detail="Consider closing position. Loss: -3.1%"
              />
              <RiskAlert
                level="info"
                title="Tech sector exposure high"
                detail="34% of portfolio in tech. Consider diversifying."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAlert({ level, title, detail }: { level: "info" | "warning" | "danger"; title: string; detail: string }) {
  const styles = {
    info: "border-accent-blue/20 bg-accent-blue/5",
    warning: "border-accent-amber/20 bg-accent-amber/5",
    danger: "border-accent-red/20 bg-accent-red/5",
  };
  const iconColors = {
    info: "text-accent-blue",
    warning: "text-accent-amber",
    danger: "text-accent-red",
  };

  return (
    <div className={`border rounded-lg p-3.5 ${styles[level]}`}>
      <div className="flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 mt-0.5 ${iconColors[level]}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <div className="text-[13px] font-medium">{title}</div>
          <div className="text-[12px] text-t-secondary mt-0.5">{detail}</div>
        </div>
      </div>
    </div>
  );
}
