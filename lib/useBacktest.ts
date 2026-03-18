"use client";

import { useState, useCallback, useEffect } from "react";
import type { BacktestConfig, BacktestResult, BacktestTrade } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/store";

const STORE_KEY = "backtest-results";

function generateId() {
  return `bt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Generate deterministic pseudo-random price data for historical replay
function generateHistoricalPrices(
  ticker: string,
  startDate: string,
  endDate: string,
  basePrice: number
): { date: string; open: number; high: number; low: number; close: number }[] {
  const prices: { date: string; open: number; high: number; low: number; close: number }[] = [];
  let price = basePrice;
  const seed = ticker.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  let rng = seed;

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue; // Skip weekends

    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    const change = ((rng % 1000) / 1000 - 0.48) * 0.04; // Slight upward bias
    const open = price;
    price = price * (1 + change);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.abs(change) * 0.5);
    const low = Math.min(open, close) * (1 - Math.abs(change) * 0.5);

    prices.push({
      date: d.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });
  }

  return prices;
}

// Simulate a backtest using historical price data and signal replay
function runBacktest(config: BacktestConfig): BacktestResult {
  const tickers = ["NVDA", "TSLA", "AAPL", "BTC", "XOM", "ETH", "AMZN"];
  const basePrices: Record<string, number> = {
    NVDA: 450, TSLA: 220, AAPL: 175, BTC: 42000, XOM: 95, ETH: 2200, AMZN: 155, MSFT: 380,
  };

  const trades: BacktestTrade[] = [];
  let capital = config.initialCapital;
  const equityCurve: { date: string; value: number }[] = [];

  // Generate price series for each ticker
  const allPrices = new Map<string, ReturnType<typeof generateHistoricalPrices>>();
  for (const ticker of tickers) {
    allPrices.set(
      ticker,
      generateHistoricalPrices(ticker, config.startDate, config.endDate, basePrices[ticker] || 100)
    );
  }

  // Simple signal replay: check each day for entry/exit conditions
  const positions = new Map<string, { entryPrice: number; entryDate: string; shares: number }>();

  // Get all dates from the first ticker's price data
  const dates = allPrices.get(tickers[0])?.map((p) => p.date) || [];

  for (const date of dates) {
    let dayValue = capital;

    for (const ticker of tickers) {
      const priceData = allPrices.get(ticker);
      if (!priceData) continue;

      const todayIdx = priceData.findIndex((p) => p.date === date);
      if (todayIdx < 5) continue; // Need some history

      const today = priceData[todayIdx];
      const prev = priceData[todayIdx - 1];
      const prevWeek = priceData[todayIdx - 5];

      const pos = positions.get(ticker);

      if (pos) {
        // Check exits
        dayValue += pos.shares * today.close;
        const pnlPct = ((today.close - pos.entryPrice) / pos.entryPrice) * 100;

        let exitReason: BacktestTrade["exitReason"] | null = null;
        if (pnlPct >= config.takeProfitPercent) exitReason = "take-profit";
        else if (pnlPct <= -config.stopLossPercent) exitReason = "stop-loss";
        else if (today.close < prev.close && prev.close < priceData[todayIdx - 2]?.close)
          exitReason = "signal-reversal";

        if (exitReason) {
          const proceeds = pos.shares * today.close;
          capital += proceeds;
          trades.push({
            id: generateId(),
            ticker,
            direction: "buy",
            entryDate: pos.entryDate,
            entryPrice: pos.entryPrice,
            exitDate: date,
            exitPrice: today.close,
            pnlPercent: Math.round(pnlPct * 100) / 100,
            pnlAmount: Math.round((proceeds - pos.shares * pos.entryPrice) * 100) / 100,
            signalConfidence: 60 + Math.random() * 30,
            exitReason,
          });
          positions.delete(ticker);
        }
      } else {
        // Check entries — simple momentum signal
        if (!prevWeek) continue;
        const momentum = (today.close - prevWeek.close) / prevWeek.close;
        const simConfidence = 50 + momentum * 200; // rough confidence

        if (simConfidence >= config.minConfidence && momentum > 0.01) {
          const positionSize = capital * (config.maxPositionSize / 100);
          const shares = Math.floor(positionSize / today.close);
          if (shares > 0 && positionSize <= capital) {
            capital -= shares * today.close;
            positions.set(ticker, {
              entryPrice: today.close,
              entryDate: date,
              shares,
            });
          }
        }
      }
    }

    // Equity = cash + open position values
    let openValue = 0;
    for (const [ticker, pos] of positions) {
      const priceData = allPrices.get(ticker);
      const todayPrice = priceData?.find((p) => p.date === date);
      if (todayPrice) openValue += pos.shares * todayPrice.close;
    }

    equityCurve.push({
      date,
      value: Math.round((capital + openValue) * 100) / 100,
    });
  }

  // Close any remaining positions at end
  for (const [ticker, pos] of positions) {
    const priceData = allPrices.get(ticker);
    const lastPrice = priceData?.[priceData.length - 1];
    if (lastPrice) {
      const proceeds = pos.shares * lastPrice.close;
      const pnlPct = ((lastPrice.close - pos.entryPrice) / pos.entryPrice) * 100;
      capital += proceeds;
      trades.push({
        id: generateId(),
        ticker,
        direction: "buy",
        entryDate: pos.entryDate,
        entryPrice: pos.entryPrice,
        exitDate: lastPrice.date,
        exitPrice: lastPrice.close,
        pnlPercent: Math.round(pnlPct * 100) / 100,
        pnlAmount: Math.round((proceeds - pos.shares * pos.entryPrice) * 100) / 100,
        signalConfidence: 65,
        exitReason: "end-of-period",
      });
    }
  }

  // Calculate metrics
  const wins = trades.filter((t) => t.pnlPercent > 0);
  const losses = trades.filter((t) => t.pnlPercent <= 0);
  const totalReturn =
    ((equityCurve[equityCurve.length - 1]?.value || config.initialCapital) -
      config.initialCapital) /
    config.initialCapital;

  // Max drawdown
  let peak = config.initialCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = (peak - point.value) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnlPercent, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((s, t) => s + t.pnlPercent, 0) / losses.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnlAmount, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnlAmount, 0));

  return {
    id: generateId(),
    config,
    trades,
    metrics: {
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
      sharpeRatio: Math.round((totalReturn / (maxDrawdown || 1)) * 100) / 100,
      totalReturn: Math.round(totalReturn * 10000) / 100,
      profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 999,
    },
    equityCurve,
    completedAt: new Date().toISOString(),
  };
}

export function useBacktest() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setResults(storeGet<BacktestResult[]>(STORE_KEY, []));
  }, []);

  const persist = useCallback((updated: BacktestResult[]) => {
    setResults(updated);
    storeSet(STORE_KEY, updated);
  }, []);

  const run = useCallback(
    async (config: BacktestConfig) => {
      setRunning(true);

      // Run in a timeout to avoid blocking UI
      return new Promise<BacktestResult>((resolve) => {
        setTimeout(() => {
          const result = runBacktest(config);
          persist([result, ...results]);
          setRunning(false);
          resolve(result);
        }, 100);
      });
    },
    [results, persist]
  );

  const deleteResult = useCallback(
    (id: string) => {
      persist(results.filter((r) => r.id !== id));
    },
    [results, persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    results,
    running,
    run,
    deleteResult,
    clearAll,
  };
}
