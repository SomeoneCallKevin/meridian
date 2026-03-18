"use client";

import { useState, useCallback, useEffect } from "react";
import type { PaperAccount, PaperPosition, PaperTrade } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/store";

const STORE_KEY = "paper-account";
const DEFAULT_CAPITAL = 100000;

function generateId() {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultAccount(): PaperAccount {
  return {
    id: generateId(),
    name: "Paper Portfolio",
    initialCapital: DEFAULT_CAPITAL,
    cash: DEFAULT_CAPITAL,
    positions: [],
    closedTrades: [],
    createdAt: new Date().toISOString(),
  };
}

export function usePaperTrading() {
  const [account, setAccount] = useState<PaperAccount>(createDefaultAccount());

  useEffect(() => {
    const saved = storeGet<PaperAccount | null>(STORE_KEY, null);
    if (saved) setAccount(saved);
  }, []);

  const persist = useCallback((updated: PaperAccount) => {
    setAccount(updated);
    storeSet(STORE_KEY, updated);
  }, []);

  // ─── Open a position ─────────────────────────────────────

  const openPosition = useCallback(
    (
      ticker: string,
      shares: number,
      price: number,
      signalId: string | null = null,
      stopLoss: number | null = null,
      takeProfit: number | null = null
    ) => {
      const cost = shares * price;
      if (cost > account.cash) {
        return { success: false, error: "Insufficient funds" };
      }

      // Check if already holding this ticker
      const existing = account.positions.find((p) => p.ticker === ticker);
      if (existing) {
        // Average into position
        const totalShares = existing.shares + shares;
        const avgPrice =
          (existing.entryPrice * existing.shares + price * shares) / totalShares;
        const updated: PaperAccount = {
          ...account,
          cash: account.cash - cost,
          positions: account.positions.map((p) =>
            p.ticker === ticker
              ? {
                  ...p,
                  shares: totalShares,
                  entryPrice: Math.round(avgPrice * 100) / 100,
                  currentPrice: price,
                  stopLoss: stopLoss ?? p.stopLoss,
                  takeProfit: takeProfit ?? p.takeProfit,
                }
              : p
          ),
        };
        persist(updated);
        return { success: true };
      }

      const position: PaperPosition = {
        ticker: ticker.toUpperCase(),
        shares,
        entryPrice: price,
        entryDate: new Date().toISOString(),
        currentPrice: price,
        signalId,
        stopLoss,
        takeProfit,
      };

      persist({
        ...account,
        cash: account.cash - cost,
        positions: [...account.positions, position],
      });
      return { success: true };
    },
    [account, persist]
  );

  // ─── Close a position ────────────────────────────────────

  const closePosition = useCallback(
    (ticker: string, exitPrice: number, exitReason = "manual") => {
      const position = account.positions.find((p) => p.ticker === ticker);
      if (!position) {
        return { success: false, error: "Position not found" };
      }

      const proceeds = position.shares * exitPrice;
      const cost = position.shares * position.entryPrice;
      const pnl = proceeds - cost;
      const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

      const trade: PaperTrade = {
        id: generateId(),
        ticker: position.ticker,
        direction: "buy", // For now, long-only
        shares: position.shares,
        entryPrice: position.entryPrice,
        entryDate: position.entryDate,
        exitPrice,
        exitDate: new Date().toISOString(),
        pnl: Math.round(pnl * 100) / 100,
        pnlPercent: Math.round(pnlPercent * 100) / 100,
        signalId: position.signalId,
        exitReason,
      };

      persist({
        ...account,
        cash: account.cash + proceeds,
        positions: account.positions.filter((p) => p.ticker !== ticker),
        closedTrades: [trade, ...account.closedTrades],
      });

      return { success: true, trade };
    },
    [account, persist]
  );

  // ─── Update current prices ───────────────────────────────

  const updatePrices = useCallback(
    (prices: Record<string, number>) => {
      const updated = {
        ...account,
        positions: account.positions.map((p) => ({
          ...p,
          currentPrice: prices[p.ticker] ?? p.currentPrice,
        })),
      };
      persist(updated);

      // Check stop-loss and take-profit triggers
      const triggers: { ticker: string; reason: string; price: number }[] = [];
      for (const pos of updated.positions) {
        const price = prices[pos.ticker];
        if (!price) continue;
        if (pos.stopLoss && price <= pos.stopLoss) {
          triggers.push({ ticker: pos.ticker, reason: "stop-loss", price });
        }
        if (pos.takeProfit && price >= pos.takeProfit) {
          triggers.push({ ticker: pos.ticker, reason: "take-profit", price });
        }
      }
      return triggers;
    },
    [account, persist]
  );

  // ─── Reset account ───────────────────────────────────────

  const resetAccount = useCallback(
    (capital = DEFAULT_CAPITAL) => {
      persist({
        ...createDefaultAccount(),
        initialCapital: capital,
        cash: capital,
      });
    },
    [persist]
  );

  // ─── Computed values ─────────────────────────────────────

  const positionsValue = account.positions.reduce(
    (sum, p) => sum + p.shares * p.currentPrice,
    0
  );
  const totalValue = account.cash + positionsValue;
  const totalPnl = totalValue - account.initialCapital;
  const totalPnlPercent =
    ((totalValue - account.initialCapital) / account.initialCapital) * 100;

  const closedPnl = account.closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const winRate =
    account.closedTrades.length > 0
      ? (account.closedTrades.filter((t) => t.pnl > 0).length /
          account.closedTrades.length) *
        100
      : 0;

  return {
    account,
    openPosition,
    closePosition,
    updatePrices,
    resetAccount,
    // Computed
    totalValue: Math.round(totalValue * 100) / 100,
    positionsValue: Math.round(positionsValue * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    totalPnlPercent: Math.round(totalPnlPercent * 100) / 100,
    closedPnl: Math.round(closedPnl * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    positionCount: account.positions.length,
    tradeCount: account.closedTrades.length,
  };
}
