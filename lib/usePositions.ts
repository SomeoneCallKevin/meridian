"use client";

import { useState, useCallback, useEffect } from "react";
import { storeGet, storeSet } from "@/lib/store";

export type PositionEntry = {
  id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  notes: string;
  openedAt: string;
};

export type ClosedPosition = {
  id: string;
  ticker: string;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;        // dollar P&L
  pnlPercent: number;
  openedAt: string;
  closedAt: string;
};

const OPEN_KEY = "positions-open";
const CLOSED_KEY = "positions-closed";

function genId() {
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function usePositions() {
  const [positions, setPositions] = useState<PositionEntry[]>([]);
  const [closed, setClosed] = useState<ClosedPosition[]>([]);

  useEffect(() => {
    setPositions(storeGet<PositionEntry[]>(OPEN_KEY, []));
    setClosed(storeGet<ClosedPosition[]>(CLOSED_KEY, []));
  }, []);

  const persistOpen = useCallback((updated: PositionEntry[]) => {
    setPositions(updated);
    storeSet(OPEN_KEY, updated);
  }, []);

  const persistClosed = useCallback((updated: ClosedPosition[]) => {
    setClosed(updated);
    storeSet(CLOSED_KEY, updated);
  }, []);

  const openPosition = useCallback(
    (entry: Omit<PositionEntry, "id" | "openedAt">) => {
      const pos: PositionEntry = {
        ...entry,
        id: genId(),
        openedAt: new Date().toISOString(),
      };
      persistOpen([pos, ...positions]);
    },
    [positions, persistOpen]
  );

  const closePosition = useCallback(
    (id: string, exitPrice: number) => {
      const pos = positions.find((p) => p.id === id);
      if (!pos) return;

      const pnl = (exitPrice - pos.entryPrice) * pos.shares;
      const pnlPercent = ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100;

      const closedEntry: ClosedPosition = {
        id: pos.id,
        ticker: pos.ticker,
        shares: pos.shares,
        entryPrice: pos.entryPrice,
        exitPrice,
        pnl,
        pnlPercent,
        openedAt: pos.openedAt,
        closedAt: new Date().toISOString(),
      };

      persistClosed([closedEntry, ...closed]);
      persistOpen(positions.filter((p) => p.id !== id));
    },
    [positions, closed, persistOpen, persistClosed]
  );

  const updatePosition = useCallback(
    (id: string, updates: Partial<Pick<PositionEntry, "stopLoss" | "takeProfit" | "notes" | "shares">>) => {
      persistOpen(
        positions.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [positions, persistOpen]
  );

  const removePosition = useCallback(
    (id: string) => {
      persistOpen(positions.filter((p) => p.id !== id));
    },
    [positions, persistOpen]
  );

  return {
    positions,
    closed,
    openPosition,
    closePosition,
    updatePosition,
    removePosition,
    count: positions.length,
  };
}
