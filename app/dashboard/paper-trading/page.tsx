"use client";

import { useState } from "react";
import { usePaperTrading } from "@/lib/usePaperTrading";

export default function PaperTradingPage() {
  const {
    account,
    openPosition,
    closePosition,
    resetAccount,
    totalValue,
    positionsValue,
    totalPnl,
    totalPnlPercent,
    closedPnl,
    winRate,
    positionCount,
    tradeCount,
  } = usePaperTrading();

  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  const handleBuy = () => {
    const t = ticker.trim().toUpperCase();
    const s = parseFloat(shares);
    const p = parseFloat(price);
    if (!t || isNaN(s) || isNaN(p) || s <= 0 || p <= 0) return;
    openPosition(t, s, p);
    setTicker("");
    setShares("");
    setPrice("");
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Paper Trading</h2>
          <p className="text-sm text-t-secondary mt-1">
            Simulated portfolio — practice without real money
          </p>
        </div>
        <button
          onClick={() => resetAccount()}
          className="px-4 py-2 text-xs font-medium text-t-muted border border-white/[0.06] rounded-lg hover:border-accent-red/30 hover:text-accent-red transition-colors"
        >
          Reset account
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Portfolio Value</div>
          <div className="text-2xl font-mono font-semibold mt-1">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Total P&L</div>
          <div className={`text-2xl font-mono font-semibold mt-1 ${totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString()} ({totalPnlPercent.toFixed(1)}%)
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Cash Available</div>
          <div className="text-2xl font-mono font-semibold mt-1">
            ${account.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Win Rate</div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {tradeCount > 0 ? `${winRate}%` : "—"}
          </div>
          <div className="text-xs text-t-muted mt-0.5">{tradeCount} closed trade{tradeCount !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Quick trade */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Open position</h3>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-t-muted block mb-1">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="NVDA"
              className="w-28 bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="10"
              className="w-24 bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="185.00"
              className="w-32 bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <button
            onClick={handleBuy}
            className="px-5 py-2 bg-accent-green/10 border border-accent-green/20 rounded-lg text-sm font-medium text-accent-green hover:bg-accent-green/15 transition-colors"
          >
            Buy
          </button>
        </div>
      </div>

      {/* Open positions */}
      <div className="bg-card border border-white/[0.06] rounded-xl">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold">Open positions ({positionCount})</h3>
        </div>
        {account.positions.length === 0 ? (
          <div className="p-8 text-center text-t-muted text-sm">
            No open positions. Use the form above to open one.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {account.positions.map((pos) => {
              const pnl = ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
              return (
                <div key={pos.ticker} className="px-5 py-4 flex items-center gap-6">
                  <div className="font-mono font-semibold w-16">{pos.ticker}</div>
                  <div className="text-sm text-t-secondary">
                    {pos.shares} shares @ ${pos.entryPrice.toFixed(2)}
                  </div>
                  <div className="flex-1 text-right font-mono text-sm">
                    ${pos.currentPrice.toFixed(2)}
                  </div>
                  <div className={`font-mono text-sm w-24 text-right ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                    {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}%
                  </div>
                  <button
                    onClick={() => closePosition(pos.ticker, pos.currentPrice, "manual")}
                    className="px-3 py-1.5 text-xs font-medium border border-white/[0.06] rounded-lg hover:border-accent-red/30 hover:text-accent-red transition-colors"
                  >
                    Close
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closed trades */}
      {account.closedTrades.length > 0 && (
        <div className="bg-card border border-white/[0.06] rounded-xl">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold">
              Closed trades ({tradeCount}) — Realized P&L:{" "}
              <span className={closedPnl >= 0 ? "text-accent-green" : "text-accent-red"}>
                {closedPnl >= 0 ? "+" : ""}${closedPnl.toLocaleString()}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {account.closedTrades.slice(0, 20).map((trade) => (
              <div key={trade.id} className="px-5 py-3 flex items-center gap-6 text-sm">
                <div className="font-mono font-semibold w-16">{trade.ticker}</div>
                <div className="text-t-secondary">
                  {trade.shares} @ ${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)}
                </div>
                <div className="flex-1" />
                <div className={`font-mono ${trade.pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)} ({trade.pnlPercent.toFixed(1)}%)
                </div>
                <div className="text-xs text-t-muted capitalize">{trade.exitReason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
