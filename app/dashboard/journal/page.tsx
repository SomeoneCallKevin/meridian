"use client";

import { useState } from "react";

type JournalEntry = {
  id: string;
  date: string;
  ticker: string;
  direction: "buy" | "sell";
  signalConf: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  outcome: "win" | "loss";
  signalBasis: string;
  holdTime: string;
  notes: string;
};

const mockJournal: JournalEntry[] = [
  {
    id: "j-1",
    date: "Mar 14, 2026",
    ticker: "AAPL",
    direction: "buy",
    signalConf: 76,
    entryPrice: 188.2,
    exitPrice: 194.6,
    pnl: 3.4,
    outcome: "win",
    signalBasis: "News + TA",
    holdTime: "4 days",
    notes: "Earnings beat drove the move. Signal was right on timing.",
  },
  {
    id: "j-2",
    date: "Mar 12, 2026",
    ticker: "CL",
    direction: "sell",
    signalConf: 68,
    entryPrice: 84.1,
    exitPrice: 82.4,
    pnl: 2.0,
    outcome: "win",
    signalBasis: "Geopolitical",
    holdTime: "2 days",
    notes: "OPEC signal was accurate. Sold ahead of the production announcement.",
  },
  {
    id: "j-3",
    date: "Mar 10, 2026",
    ticker: "ETH",
    direction: "buy",
    signalConf: 52,
    entryPrice: 3520,
    exitPrice: 3380,
    pnl: -4.0,
    outcome: "loss",
    signalBasis: "Sentiment",
    holdTime: "5 days",
    notes: "Low confidence signal. Social hype didn't translate to sustained buying. Should have waited for TA confirmation.",
  },
  {
    id: "j-4",
    date: "Mar 8, 2026",
    ticker: "NVDA",
    direction: "buy",
    signalConf: 82,
    entryPrice: 795.0,
    exitPrice: 812.4,
    pnl: 2.2,
    outcome: "win",
    signalBasis: "News + TA",
    holdTime: "3 days",
    notes: "Pre-earnings run-up caught by the sentiment engine. Exited before actual earnings for safety.",
  },
  {
    id: "j-5",
    date: "Mar 6, 2026",
    ticker: "TSLA",
    direction: "buy",
    signalConf: 61,
    entryPrice: 252.3,
    exitPrice: 245.8,
    pnl: -2.6,
    outcome: "loss",
    signalBasis: "TA only",
    holdTime: "4 days",
    notes: "Technical signal only — no news or sentiment confirmation. TA-only signals continue to underperform.",
  },
  {
    id: "j-6",
    date: "Mar 4, 2026",
    ticker: "XOM",
    direction: "buy",
    signalConf: 74,
    entryPrice: 105.2,
    exitPrice: 108.5,
    pnl: 3.1,
    outcome: "win",
    signalBasis: "Geopolitical + TA",
    holdTime: "3 days",
    notes: "Middle East tension signal worked well. Entry at support level was good timing.",
  },
  {
    id: "j-7",
    date: "Mar 2, 2026",
    ticker: "BTC",
    direction: "buy",
    signalConf: 70,
    entryPrice: 59800,
    exitPrice: 62100,
    pnl: 3.8,
    outcome: "win",
    signalBasis: "News + Social",
    holdTime: "6 days",
    notes: "ETF flow narrative played out. Social signals were unusually accurate here.",
  },
];

const tabs = ["All", "Wins", "Losses"];

export default function JournalPage() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? mockJournal
      : activeTab === "Wins"
      ? mockJournal.filter((j) => j.outcome === "win")
      : mockJournal.filter((j) => j.outcome === "loss");

  const totalTrades = mockJournal.length;
  const wins = mockJournal.filter((j) => j.outcome === "win").length;
  const winRate = Math.round((wins / totalTrades) * 100);
  const avgWin = mockJournal.filter((j) => j.pnl > 0).reduce((a, j) => a + j.pnl, 0) / wins;
  const losses = mockJournal.filter((j) => j.outcome === "loss").length;
  const avgLoss = Math.abs(mockJournal.filter((j) => j.pnl < 0).reduce((a, j) => a + j.pnl, 0) / losses);
  const totalPnl = mockJournal.reduce((a, j) => a + j.pnl, 0);

  // Signal basis performance
  const basisPerf: Record<string, { wins: number; total: number }> = {};
  mockJournal.forEach((j) => {
    if (!basisPerf[j.signalBasis]) basisPerf[j.signalBasis] = { wins: 0, total: 0 };
    basisPerf[j.signalBasis].total++;
    if (j.outcome === "win") basisPerf[j.signalBasis].wins++;
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Trade journal</h2>
        <p className="text-sm text-t-muted mt-1">
          Track every trade, learn from outcomes, improve over time
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
          <div className="text-[24px] font-semibold font-mono text-accent-green">{winRate}%</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg win</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">+{avgWin.toFixed(1)}%</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg loss</div>
          <div className="text-[24px] font-semibold font-mono text-accent-red">-{avgLoss.toFixed(1)}%</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total P&L</div>
          <div className={`text-[24px] font-semibold font-mono ${totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {totalPnl > 0 ? "+" : ""}{totalPnl.toFixed(1)}%
          </div>
        </div>
      </div>

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
          {filtered.map((entry) => (
            <JournalCard key={entry.id} entry={entry} />
          ))}
        </div>

        {/* Insights sidebar */}
        <div className="flex flex-col gap-6">
          {/* Signal basis performance */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Performance by signal type</div>
            <div className="flex flex-col gap-3">
              {Object.entries(basisPerf)
                .sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))
                .map(([basis, perf]) => {
                  const rate = Math.round((perf.wins / perf.total) * 100);
                  return (
                    <div key={basis}>
                      <div className="flex justify-between text-[13px] mb-1.5">
                        <span className="text-t-secondary">{basis}</span>
                        <span className={`font-mono font-medium ${rate >= 60 ? "text-accent-green" : rate >= 40 ? "text-accent-amber" : "text-accent-red"}`}>
                          {rate}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 60 ? "bg-accent-green" : rate >= 40 ? "bg-accent-amber" : "bg-accent-red"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-t-muted mt-1">
                        {perf.wins}W / {perf.total - perf.wins}L out of {perf.total} trades
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Key learnings */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Key patterns</div>
            <div className="flex flex-col gap-3">
              <Insight
                type="positive"
                text="Multi-source signals (News + TA, Geopolitical + TA) have the highest win rate at 100%."
              />
              <Insight
                type="negative"
                text="TA-only signals are underperforming at 0% win rate. Consider requiring at least one additional source."
              />
              <Insight
                type="positive"
                text="Geopolitical signals for energy trades are performing well — 2 for 2 on oil-related trades."
              />
              <Insight
                type="neutral"
                text="Average hold time for winners: 3.6 days. For losers: 4.5 days. Cut losers faster."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalCard({ entry }: { entry: JournalEntry }) {
  const isWin = entry.outcome === "win";

  return (
    <div className="py-4 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono font-medium text-[14px]">{entry.ticker}</span>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
          entry.direction === "buy" ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
        }`}>
          {entry.direction}
        </span>
        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
          isWin ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
        }`}>
          {isWin ? "WIN" : "LOSS"}
        </span>
        <span className={`font-mono text-[13px] font-medium ${isWin ? "text-accent-green" : "text-accent-red"}`}>
          {entry.pnl > 0 ? "+" : ""}{entry.pnl}%
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-t-muted">{entry.date}</span>
      </div>

      <div className="flex gap-4 text-[12px] text-t-muted mb-2.5">
        <span>Entry: ${entry.entryPrice.toLocaleString()}</span>
        <span>Exit: ${entry.exitPrice.toLocaleString()}</span>
        <span>Hold: {entry.holdTime}</span>
        <span>Conf: {entry.signalConf}%</span>
        <span>Basis: {entry.signalBasis}</span>
      </div>

      <div className="text-[12px] text-t-secondary leading-relaxed bg-white/[0.02] rounded-lg px-3.5 py-2.5 border-l-2 border-white/[0.06]">
        {entry.notes}
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
