"use client";

import { useState, useEffect } from "react";

export type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

export function useQuotes(refreshInterval = 30000) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch("/api/quotes");
        if (!res.ok) return;
        const data = await res.json();
        if (data.quotes && data.quotes.length > 0) {
          setQuotes(data.quotes);
          setIsLive(true);
          setUpdatedAt(data.updatedAt);
        }
      } catch {
        // Keep existing data
      }
    }

    fetchQuotes();
    const interval = setInterval(fetchQuotes, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  function getQuote(symbol: string): Quote | undefined {
    return quotes.find((q) => q.symbol === symbol);
  }

  return { quotes, isLive, updatedAt, getQuote };
}
