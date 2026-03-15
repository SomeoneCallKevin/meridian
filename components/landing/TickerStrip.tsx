"use client";

import { useState, useEffect } from "react";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

// Fallback data in case API fails
const fallbackQuotes: Quote[] = [
  { symbol: "NVDA", price: 878.2, change: 29.02, changePercent: 3.41 },
  { symbol: "BTC", price: 64800, change: 1157.76, changePercent: 1.82 },
  { symbol: "TSLA", price: 238.1, change: -5.21, changePercent: -2.14 },
  { symbol: "ETH", price: 3380, change: -19.7, changePercent: -0.58 },
  { symbol: "AAPL", price: 194.6, change: 1.41, changePercent: 0.73 },
  { symbol: "XOM", price: 112.3, change: 2.28, changePercent: 2.07 },
  { symbol: "AMZN", price: 186.4, change: 1.53, changePercent: 0.83 },
  { symbol: "MSFT", price: 415.6, change: 3.12, changePercent: 0.76 },
];

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(2)}`;
}

function TickerItem({ symbol, price, changePercent }: Quote) {
  const isUp = changePercent >= 0;
  return (
    <div className="flex items-center gap-3 font-mono text-sm text-t-secondary whitespace-nowrap">
      <span className="text-t-primary font-medium">{symbol}</span>
      {formatPrice(price)}
      <span className={isUp ? "text-accent-green" : "text-accent-red"}>
        {isUp ? "+" : ""}
        {changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

export default function TickerStrip() {
  const [quotes, setQuotes] = useState<Quote[]>(fallbackQuotes);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch("/api/quotes");
        if (!res.ok) return;
        const data = await res.json();
        if (data.quotes && data.quotes.length > 0) {
          setQuotes(data.quotes);
          setIsLive(true);
        }
      } catch {
        // Keep fallback data
      }
    }

    fetchQuotes();

    // Refresh every 30 seconds
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Double the items for seamless scroll
  const doubled = [...quotes, ...quotes];

  return (
    <div className="py-6 border-t border-b border-white/[0.06] overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-[120px] bg-gradient-to-r from-deep to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-[120px] bg-gradient-to-l from-deep to-transparent z-10 pointer-events-none" />

      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-1.5 right-4 z-20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
          <span className="text-[10px] text-t-muted font-mono">LIVE</span>
        </div>
      )}

      <div className="flex gap-12 animate-scroll-ticker w-max">
        {doubled.map((q, i) => (
          <TickerItem key={`${q.symbol}-${i}`} {...q} />
        ))}
      </div>
    </div>
  );
}
