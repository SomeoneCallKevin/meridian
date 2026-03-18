"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useWatchlist } from "@/lib/useWatchlist";
import PriceChart from "@/components/dashboard/PriceChart";

type SearchResult = {
  symbol: string;
  description: string;
  type: string;
};

type WatchlistQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const POPULAR_STOCKS = [
  { symbol: "NVDA", name: "NVIDIA", sector: "Tech" },
  { symbol: "AAPL", name: "Apple", sector: "Tech" },
  { symbol: "TSLA", name: "Tesla", sector: "Auto" },
  { symbol: "MSFT", name: "Microsoft", sector: "Tech" },
  { symbol: "AMZN", name: "Amazon", sector: "Tech" },
  { symbol: "GOOGL", name: "Alphabet", sector: "Tech" },
  { symbol: "META", name: "Meta", sector: "Tech" },
  { symbol: "AMD", name: "AMD", sector: "Chips" },
  { symbol: "XOM", name: "ExxonMobil", sector: "Energy" },
  { symbol: "JPM", name: "JPMorgan", sector: "Finance" },
  { symbol: "V", name: "Visa", sector: "Finance" },
  { symbol: "UNH", name: "UnitedHealth", sector: "Health" },
];

export default function WatchlistPage() {
  const { items, addTicker, removeTicker, updateNotes, count, isWatching } =
    useWatchlist();

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Live quotes for watchlist items
  const [quotes, setQuotes] = useState<Map<string, WatchlistQuote>>(new Map());

  // Expanded card (to show chart)
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  // ─── Search with debounce ──────────────────────────────

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch {
        // Ignore
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Fetch live quotes for watchlist tickers ───────────

  const fetchQuotes = useCallback(async () => {
    if (items.length === 0) return;
    const symbols = items.map((i) => i.ticker).join(",");
    try {
      const res = await fetch(`/api/quotes?symbols=${symbols}`);
      if (!res.ok) return;
      const data = await res.json();
      const map = new Map<string, WatchlistQuote>();
      for (const q of data.quotes || []) {
        map.set(q.symbol, q);
      }
      setQuotes(map);
    } catch {
      // Keep existing
    }
  }, [items]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // ─── Handlers ──────────────────────────────────────────

  const handleAddFromSearch = (symbol: string) => {
    addTicker(symbol);
    setQuery("");
    setShowDropdown(false);
  };

  const handleAddPopular = (symbol: string) => {
    addTicker(symbol);
  };

  const toggleExpand = (ticker: string) => {
    setExpandedTicker(expandedTicker === ticker ? null : ticker);
  };

  // ─── Computed ──────────────────────────────────────────

  const gainers = items.filter(
    (i) => (quotes.get(i.ticker)?.changePercent ?? 0) > 0
  ).length;
  const losers = items.filter(
    (i) => (quotes.get(i.ticker)?.changePercent ?? 0) < 0
  ).length;

  return (
    <div className="max-w-[1200px] space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <p className="text-sm text-t-secondary mt-1">
          Track assets with live prices and charts
        </p>
      </div>

      {/* ─── Search bar ─── */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-t-muted"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search stocks, ETFs, crypto… (e.g. NVIDIA, AAPL)"
            className="w-full bg-card border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30 transition-colors"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-white/[0.06] rounded-xl shadow-2xl z-50 overflow-hidden">
            {results.map((r) => {
              const alreadyWatching = isWatching(r.symbol);
              return (
                <button
                  key={r.symbol}
                  onClick={() =>
                    !alreadyWatching && handleAddFromSearch(r.symbol)
                  }
                  disabled={alreadyWatching}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                    alreadyWatching
                      ? "opacity-40 cursor-default"
                      : "hover:bg-white/[0.04] cursor-pointer"
                  }`}
                >
                  <div className="w-16 font-mono font-semibold text-t-primary text-sm">
                    {r.symbol}
                  </div>
                  <div className="flex-1 text-sm text-t-secondary truncate">
                    {r.description}
                  </div>
                  <div className="text-[10px] text-t-muted uppercase tracking-wider">
                    {r.type === "Common Stock" ? "Stock" : r.type}
                  </div>
                  {alreadyWatching ? (
                    <span className="text-[10px] text-accent-green font-medium">
                      Watching
                    </span>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-t-muted"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {showDropdown &&
          query.trim() &&
          results.length === 0 &&
          !searching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-white/[0.06] rounded-xl shadow-2xl z-50 p-4 text-center text-sm text-t-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
      </div>

      {/* ─── Popular stocks ─── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-t-muted mb-3">
          Popular &mdash; quick add
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_STOCKS.map((stock) => {
            const watching = isWatching(stock.symbol);
            return (
              <button
                key={stock.symbol}
                onClick={() => !watching && handleAddPopular(stock.symbol)}
                disabled={watching}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  watching
                    ? "bg-accent-green/5 border-accent-green/20 text-accent-green"
                    : "bg-card border-white/[0.06] text-t-secondary hover:border-accent-green/20 hover:text-t-primary"
                }`}
              >
                <span className="font-mono font-semibold text-xs">
                  {stock.symbol}
                </span>
                <span className="text-t-muted text-xs">{stock.name}</span>
                {watching ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-accent-green"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-t-muted"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Summary cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Watching
          </div>
          <div className="text-2xl font-mono font-semibold mt-1">{count}</div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Gainers
          </div>
          <div className="text-2xl font-mono font-semibold mt-1 text-accent-green">
            {gainers}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Losers
          </div>
          <div className="text-2xl font-mono font-semibold mt-1 text-accent-red">
            {losers}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Active Alerts
          </div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {items.reduce(
              (sum, i) => sum + i.alerts.filter((a) => a.enabled).length,
              0
            )}
          </div>
        </div>
      </div>

      {/* ─── Watchlist items ─── */}
      {items.length === 0 ? (
        <div className="bg-card border border-white/[0.06] rounded-xl p-12 text-center">
          <div className="text-t-secondary">Your watchlist is empty</div>
          <div className="text-sm text-t-muted mt-1">
            Search for stocks above or click a popular ticker to start watching
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const quote = quotes.get(item.ticker);
            const isExpanded = expandedTicker === item.ticker;
            const pctClass = quote
              ? quote.changePercent >= 0
                ? "text-accent-green"
                : "text-accent-red"
              : "text-t-muted";
            const direction = quote
              ? quote.changePercent > 0.5
                ? ("buy" as const)
                : quote.changePercent < -0.5
                  ? ("sell" as const)
                  : ("hold" as const)
              : ("hold" as const);

            return (
              <div
                key={item.ticker}
                className="bg-card border border-white/[0.06] rounded-xl overflow-hidden transition-all"
              >
                {/* Main row */}
                <div
                  className="p-5 flex items-center gap-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(item.ticker)}
                >
                  {/* Ticker */}
                  <div className="w-20">
                    <div className="font-mono font-bold text-t-primary text-base">
                      {item.ticker}
                    </div>
                    <div className="text-[10px] text-t-muted mt-0.5">
                      {POPULAR_STOCKS.find((s) => s.symbol === item.ticker)
                        ?.name || ""}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="w-32">
                    {quote ? (
                      <div className="font-mono text-t-primary text-base">
                        $
                        {quote.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-t-muted">Loading...</div>
                    )}
                  </div>

                  {/* Change */}
                  <div className="w-28">
                    {quote ? (
                      <div className="flex flex-col">
                        <span className={`font-mono text-sm ${pctClass}`}>
                          {quote.changePercent >= 0 ? "+" : ""}
                          {quote.changePercent.toFixed(2)}%
                        </span>
                        <span
                          className={`font-mono text-xs ${pctClass} opacity-60`}
                        >
                          {quote.change >= 0 ? "+" : ""}$
                          {Math.abs(quote.change).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-t-muted">&mdash;</span>
                    )}
                  </div>

                  {/* Mini bar indicator */}
                  <div className="flex-1">
                    {quote && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              quote.changePercent >= 0
                                ? "bg-accent-green"
                                : "bg-accent-red"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.abs(quote.changePercent) * 15)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes preview */}
                  {item.notes && (
                    <div className="text-xs text-t-muted max-w-[150px] truncate">
                      {item.notes}
                    </div>
                  )}

                  {/* Expand arrow */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-t-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>

                  {/* Remove */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTicker(item.ticker);
                    }}
                    className="text-t-muted hover:text-accent-red transition-colors p-1"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Expanded section — chart + details */}
                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-5 space-y-4">
                    {/* Chart */}
                    <PriceChart
                      ticker={item.ticker}
                      basePrice={quote?.price || 100}
                      direction={direction}
                    />

                    {/* Notes */}
                    <div>
                      <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.ticker, e.target.value)}
                        placeholder="Add notes about this position…"
                        className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-secondary placeholder:text-t-muted/50 focus:outline-none focus:border-accent-green/20"
                      />
                    </div>

                    {/* Quick stats */}
                    {quote && (
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-surface border border-white/[0.06] rounded-lg p-3">
                          <div className="text-[10px] text-t-muted uppercase tracking-wider">
                            Price
                          </div>
                          <div className="font-mono text-sm font-medium mt-1">
                            $
                            {quote.price.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div className="bg-surface border border-white/[0.06] rounded-lg p-3">
                          <div className="text-[10px] text-t-muted uppercase tracking-wider">
                            Change
                          </div>
                          <div
                            className={`font-mono text-sm font-medium mt-1 ${pctClass}`}
                          >
                            {quote.change >= 0 ? "+" : ""}$
                            {quote.change.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-surface border border-white/[0.06] rounded-lg p-3">
                          <div className="text-[10px] text-t-muted uppercase tracking-wider">
                            Change %
                          </div>
                          <div
                            className={`font-mono text-sm font-medium mt-1 ${pctClass}`}
                          >
                            {quote.changePercent >= 0 ? "+" : ""}
                            {quote.changePercent.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-surface border border-white/[0.06] rounded-lg p-3">
                          <div className="text-[10px] text-t-muted uppercase tracking-wider">
                            Added
                          </div>
                          <div className="text-sm text-t-secondary mt-1">
                            {new Date(item.addedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
