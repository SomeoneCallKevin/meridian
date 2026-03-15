"use client";

import { useQuotes } from "@/lib/useQuotes";

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${price.toFixed(2)}`;
}

export default function LivePricesBar() {
  const { quotes, isLive } = useQuotes();

  if (quotes.length === 0) return null;

  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-4 flex items-center gap-6 overflow-x-auto">
      <div className="flex items-center gap-2 flex-shrink-0">
        {isLive && (
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
        )}
        <span className="text-[11px] text-t-muted font-medium uppercase tracking-wider">
          Live prices
        </span>
      </div>
      <div className="h-4 w-px bg-white/[0.06]" />
      {quotes.map((q) => {
        const isUp = q.changePercent >= 0;
        return (
          <div key={q.symbol} className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[13px] font-medium text-t-primary">
              {q.symbol}
            </span>
            <span className="font-mono text-[13px] text-t-secondary">
              {formatPrice(q.price)}
            </span>
            <span
              className={`font-mono text-[12px] font-medium ${
                isUp ? "text-accent-green" : "text-accent-red"
              }`}
            >
              {isUp ? "+" : ""}
              {q.changePercent.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
