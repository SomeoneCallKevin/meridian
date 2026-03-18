"use client";

import { useState } from "react";
import { useBacktest } from "@/lib/useBacktest";
import type { BacktestConfig, SignalSourceType } from "@/lib/types";

const defaultConfig: Omit<BacktestConfig, "id"> = {
  name: "Default Strategy",
  startDate: "2025-06-01",
  endDate: "2026-03-01",
  initialCapital: 100000,
  signalSources: ["news-nlp", "technical", "social"] as SignalSourceType[],
  minConfidence: 55,
  maxPositionSize: 15,
  stopLossPercent: 5,
  takeProfitPercent: 10,
};

export default function BacktestPage() {
  const { results, running, run, deleteResult, clearAll } = useBacktest();
  const [config, setConfig] = useState(defaultConfig);

  const handleRun = async () => {
    await run({
      ...config,
      id: `cfg-${Date.now()}`,
    });
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Backtesting</h2>
        <p className="text-sm text-t-secondary mt-1">
          Replay historical signals to test strategy performance
        </p>
      </div>

      {/* Config */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold">Strategy configuration</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-t-muted block mb-1">Start date</label>
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">End date</label>
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Initial capital ($)</label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: parseInt(e.target.value) || 100000 })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Min confidence (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.minConfidence}
              onChange={(e) => setConfig({ ...config, minConfidence: parseInt(e.target.value) || 50 })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Max position size (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={config.maxPositionSize}
              onChange={(e) => setConfig({ ...config, maxPositionSize: parseInt(e.target.value) || 15 })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Stop loss (%)</label>
            <input
              type="number"
              min={0.5}
              max={50}
              step={0.5}
              value={config.stopLossPercent}
              onChange={(e) => setConfig({ ...config, stopLossPercent: parseFloat(e.target.value) || 5 })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
          <div>
            <label className="text-xs text-t-muted block mb-1">Take profit (%)</label>
            <input
              type="number"
              min={0.5}
              max={100}
              step={0.5}
              value={config.takeProfitPercent}
              onChange={(e) => setConfig({ ...config, takeProfitPercent: parseFloat(e.target.value) || 10 })}
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-mono text-t-primary focus:outline-none focus:border-accent-green/30"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleRun}
            disabled={running}
            className="px-6 py-2.5 bg-accent-green/10 border border-accent-green/20 rounded-lg text-sm font-medium text-accent-green hover:bg-accent-green/15 transition-colors disabled:opacity-50"
          >
            {running ? "Running backtest..." : "Run backtest"}
          </button>
          {results.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2.5 text-sm text-t-muted border border-white/[0.06] rounded-lg hover:border-accent-red/30 hover:text-accent-red transition-colors"
            >
              Clear results
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results.map((result) => (
        <div key={result.id} className="bg-card border border-white/[0.06] rounded-xl">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                {result.config.name} — {result.config.startDate} to {result.config.endDate}
              </h3>
              <p className="text-xs text-t-muted mt-0.5">
                ${result.config.initialCapital.toLocaleString()} initial capital
              </p>
            </div>
            <button
              onClick={() => deleteResult(result.id)}
              className="text-t-muted hover:text-accent-red transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06]">
            {[
              { label: "Total Return", value: `${result.metrics.totalReturn >= 0 ? "+" : ""}${result.metrics.totalReturn.toFixed(2)}%`, color: result.metrics.totalReturn >= 0 ? "text-accent-green" : "text-accent-red" },
              { label: "Win Rate", value: `${result.metrics.winRate.toFixed(1)}%`, color: result.metrics.winRate >= 50 ? "text-accent-green" : "text-accent-red" },
              { label: "Total Trades", value: `${result.metrics.totalTrades}`, color: "text-t-primary" },
              { label: "Profit Factor", value: `${result.metrics.profitFactor.toFixed(2)}`, color: result.metrics.profitFactor >= 1 ? "text-accent-green" : "text-accent-red" },
              { label: "Avg Win", value: `+${result.metrics.avgWin.toFixed(2)}%`, color: "text-accent-green" },
              { label: "Avg Loss", value: `${result.metrics.avgLoss.toFixed(2)}%`, color: "text-accent-red" },
              { label: "Max Drawdown", value: `${result.metrics.maxDrawdown.toFixed(2)}%`, color: "text-accent-red" },
              { label: "Sharpe Ratio", value: `${result.metrics.sharpeRatio.toFixed(2)}`, color: result.metrics.sharpeRatio >= 1 ? "text-accent-green" : "text-t-primary" },
            ].map((metric) => (
              <div key={metric.label} className="bg-card p-4">
                <div className="text-[10px] text-t-muted uppercase tracking-wider">{metric.label}</div>
                <div className={`text-lg font-mono font-semibold mt-1 ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Trades summary */}
          {result.trades.length > 0 && (
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <div className="text-xs text-t-muted">
                {result.trades.filter((t) => t.pnlPercent > 0).length} wins, {" "}
                {result.trades.filter((t) => t.pnlPercent <= 0).length} losses across{" "}
                {[...new Set(result.trades.map((t) => t.ticker))].length} tickers
              </div>
            </div>
          )}
        </div>
      ))}

      {results.length === 0 && !running && (
        <div className="bg-card border border-white/[0.06] rounded-xl p-12 text-center">
          <p className="text-t-secondary">No backtest results yet.</p>
          <p className="text-sm text-t-muted mt-1">Configure a strategy above and run a backtest.</p>
        </div>
      )}
    </div>
  );
}
