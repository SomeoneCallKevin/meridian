"use client";

import { useState, useCallback, useEffect } from "react";
import type { WatchlistItem, WatchlistAlert } from "@/lib/types";
import { storeGet, storeSet } from "@/lib/store";

const STORE_KEY = "watchlist";

function generateId() {
  return `wl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setItems(storeGet<WatchlistItem[]>(STORE_KEY, []));
  }, []);

  // Persist whenever items change
  const persist = useCallback((updated: WatchlistItem[]) => {
    setItems(updated);
    storeSet(STORE_KEY, updated);
  }, []);

  const addTicker = useCallback(
    (ticker: string, notes = "") => {
      const existing = items.find((i) => i.ticker === ticker);
      if (existing) return; // Already watching
      const item: WatchlistItem = {
        ticker: ticker.toUpperCase(),
        addedAt: new Date().toISOString(),
        notes,
        alerts: [],
      };
      persist([...items, item]);
    },
    [items, persist]
  );

  const removeTicker = useCallback(
    (ticker: string) => {
      persist(items.filter((i) => i.ticker !== ticker));
    },
    [items, persist]
  );

  const updateNotes = useCallback(
    (ticker: string, notes: string) => {
      persist(
        items.map((i) => (i.ticker === ticker ? { ...i, notes } : i))
      );
    },
    [items, persist]
  );

  const addAlert = useCallback(
    (ticker: string, alert: Omit<WatchlistAlert, "id" | "lastTriggered">) => {
      persist(
        items.map((i) =>
          i.ticker === ticker
            ? {
                ...i,
                alerts: [
                  ...i.alerts,
                  { ...alert, id: generateId(), lastTriggered: null },
                ],
              }
            : i
        )
      );
    },
    [items, persist]
  );

  const removeAlert = useCallback(
    (ticker: string, alertId: string) => {
      persist(
        items.map((i) =>
          i.ticker === ticker
            ? { ...i, alerts: i.alerts.filter((a) => a.id !== alertId) }
            : i
        )
      );
    },
    [items, persist]
  );

  const toggleAlert = useCallback(
    (ticker: string, alertId: string) => {
      persist(
        items.map((i) =>
          i.ticker === ticker
            ? {
                ...i,
                alerts: i.alerts.map((a) =>
                  a.id === alertId ? { ...a, enabled: !a.enabled } : a
                ),
              }
            : i
        )
      );
    },
    [items, persist]
  );

  const isWatching = useCallback(
    (ticker: string) => items.some((i) => i.ticker === ticker),
    [items]
  );

  return {
    items,
    addTicker,
    removeTicker,
    updateNotes,
    addAlert,
    removeAlert,
    toggleAlert,
    isWatching,
    count: items.length,
  };
}
