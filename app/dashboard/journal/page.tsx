"use client";

import { useState } from "react";
import { usePositions, type ClosedPosition } from "@/lib/usePositions";

const tabs = ["All", "Wins", "Losses"];

function fmt(price: number): string {
  if (Math.abs(price) >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(2)}`;
}

function holdTime(openedAt: string, closedAt: string): string {
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "< 1 hour";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export default function JournalPage() {
  const { closed } = usePositions();
  const [activeTab, setActiveTab] = useState("All");

  const trades = closed.map((c) => ({
    ...c,
    outcome: (c.pnl >= 0 ? "win" : "loss") as "win" | "loss",
  }));

  const filtered =
    activeTab === "All"
      ? trades
      : activeTab === "Wins"
        ? trades.filter((t) => t.outcome === "win")
        : trades.filter((t) => t.outcome === "loss");

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const avgWin = wins > 0 ? trades.filter((t) => t.pnlPercent > 0).reduce((a, t) => a + t.pnlPercent, 0) / wins : 0;
  const avgLoss = losses > 0 ? Math.abs(trades.filter((t) => t.pnlPercent < 0).reduce((a, t) => a + t.pnlPercent, 0) / losses) : 0;
  const totalPnlDollar = trades.reduce((a, t) => a + t.pnl, 0);

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Trade journal</h2>
        <p className="text-sm text-t-muted mt-1">
          Automatically logged from closed positions
        </p>
      </div>

      {/* Performance summary */}
      <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total trades</div>
          <div className="text-[24px] font-semibold font-mono">{totalTrades}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Win rate</div>
          <div className={`text-[24px] font-semibold font-mono ${totalTrades > 0 ? (winRate >= 50 ? "text-accent-green" : "text-accent-red") : "text-t-muted"}`}>
            {totalTrades > 0 ? `${winRate}%` : "—"}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg win</div>
          <div className={`text-[24px] font-semibold font-mono ${wins > 0 ? "text-accent-green" : "text-t-muted"}`}>
            {wins > 0 ? `+${avgWin.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg loss</div>
          <div className={`text-[24px] font-semibold font-mono ${losses > 0 ? "text-accent-red" : "text-t-muted"}`}>
            {losses > 0 ? `-${avgLoss.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total P&L</div>
          <div className={`text-[24px] font-semibold font-mono ${totalPnlDollar >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {totalTrades > 0 ? `${totalPnlDollar >= 0 ? "+" : ""}${fmt(totalPnlDollar)}` : "—"}
          </div>
        </div>
      </div>

      {totalTrades === 0 ? (
        <div className="bg-surface border border-white/[0.06] rounded-xl p-12 text-center">
          <p className="text-t-secondary">No closed trades yet</p>
          <p className="text-sm text-t-muted mt-1">
            When you close a position, it will automatically appear here as a journal entry
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_300px] gap-6 max-lg:grid-cols-1">
          {/* Trade list */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            {/* Tabs */}
            <div className="flex gap-0 border-b border-white/[0.06] mb-4">
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
                  {tab} ({tab === "All" ? totalTrades : tab === "Wins" ? wins : losses})
                </button>
              ))}
            </div>

            {/* Entries */}
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-t-muted">No trades in this category</div>
            ) : (
              filtered.map((trade) => (
                <JournalCard key={trade.id} trade={trade} />
              ))
            )}
          </div>

          {/* Insights sidebar */}
          <div className="flex flex-col gap-6">
            {/* Per-ticker performance */}
            <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
              <div className="text-[15px] font-semibold mb-4">Performance by ticker</div>
              <TickerBreakdown trades={trades} />
            </div>

            {/* Quick insights */}
            <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
              <div className="text-[15px] font-semibold mb-4">Insights</div>
              <div className="flex flex-col gap-3">
                {winRate >= 60 && (
                  <Insight type="positive" text={`Strong ${winRate}% win rate across ${totalTrades} trades.`} />
                )}
                {winRate > 0 && winRate < 40 && (
                  <Insight type="negative" text={`Win rate at ${winRate}%. Review your entry criteria.`} />
                )}
                {avgWin > avgLoss && wins > 0 && losses > 0 && (
                  <Insight type="positive" text={`Avg win (+${avgWin.toFixed(1)}%) exceeds avg loss (-${avgLoss.toFixed(1)}%). Good risk/reward.`} />
                )}
                {avgLoss > avgWin && wins > 0 && losses > 0 && (
                  <Insight type="negative" text={`Avg loss (-${avgLoss.toFixed(1)}%) exceeds avg win (+${avgWin.toFixed(1)}%). Tighten stop-losses.`} />
                )}
                {totalTrades > 0 && totalPnlDollar > 0 && (
                  <Insight type="positive" text={`Net profitable: ${fmt(totalPnlDollar)} across all closed trades.`} />
                )}
                {totalTrades > 0 && totalPnlDollar < 0 && (
                  <Insight type="negative" text={`Net loss: ${fmt(totalPnlDollar)}. Review position sizing and entry timing.`} />
                )}
                {totalTrades < 3 && (
                  <Insight type="neutral" text="Close more positions to unlock detailed performance insights." />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TickerBreakdown({ trades }: { trades: (ClosedPosition & { outcome: string })[] }) {
  const byTicker: Record<string, { wins: number; total: number; totalPnl: number }> = {};
  trades.forEach((t) => {
    if (!byTicker[t.ticker]) byTicker[t.ticker] = { wins: 0, total: 0, totalPnl: 0 };
    byTicker[t.ticker].total++;
    byTicker[t.ticker].totalPnl += t.pnl;
    if (t.pnl > 0) byTicker[t.ticker].wins++;
  });

  const sorted = Object.entries(byTicker).sort(([, a], [, b]) => b.totalPnl - a.totalPnl);

  if (sorted.length === 0) {
    return <p className="text-sm text-t-muted">No data yet</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([ticker, perf]) => {
        const rate = Math.round((perf.wins / perf.total) * 100);
        return (
          <div key={ticker}>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="font-mono font-medium text-t-primary">{ticker}</span>
              <span className={`font-mono font-medium ${perf.totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                {perf.totalPnl >= 0 ? "+" : ""}${perf.totalPnl.toFixed(2)}
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${rate >= 50 ? "bg-accent-green" : "bg-accent-red"}`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="text-[11px] text-t-muted mt-1">
              {perf.wins}W / {perf.total - perf.wins}L — {rate}% win rate
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JournalCard({ trade }: { trade: ClosedPosition & { outcome: string } }) {
  const isWin = trade.pnl >= 0;

  return (
    <div className="py-4 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono font-medium text-[14px]">{trade.ticker}</span>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide bg-accent-green/10 text-accent-green`}>
          buy
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
          isWin ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
        }`}>
          {isWin ? "WIN" : "LOSS"}
        </span>
        <span className={`font-mono text-[13px] font-medium ${isWin ? "text-accent-green" : "text-accent-red"}`}>
          {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
        </span>
        <span className={`font-mono text-[12px] ${isWin ? "text-accent-green/60" : "text-accent-red/60"}`}>
          ({trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)})
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-t-muted">
          {new Date(trade.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      <div className="flex gap-4 text-[12px] text-t-muted">
        <span>Entry: ${trade.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>Exit: ${trade.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span>{trade.shares} shares</span>
        <span>Held: {holdTime(trade.openedAt, trade.closedAt)}</span>
      </div>
    </div>
  );
}

function Insight({ type, text }: { type: "positive" | "negative" | "neutral"; text: string }) {
  const colors = {
    positive: "border-accent-green/20 bg-accent-green/5",
    negative: "border-accent-red/20 bg-accent-red/5",
    neutral: "border-accent-blue/20 bg-accent-blue/5",
  };
  const dots = {
    positive: "bg-accent-green",
    negative: "bg-accent-red",
    neutral: "bg-accent-blue",
  };

  return (
    <div className={`border rounded-lg p-3 ${colors[type]}`}>
      <div className="flex gap-2.5">
        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dots[type]}`} />
        <span className="text-[12px] text-t-secondary leading-relaxed">{text}</span>
      </div>
    </div>
  );
}
