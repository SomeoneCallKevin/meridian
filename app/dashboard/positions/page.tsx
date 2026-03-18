"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePositions, type PositionEntry } from "@/lib/usePositions";

type Quote = { symbol: string; price: number; change: number; changePercent: number };
type SearchResult = { symbol: string; description: string; type: string };

const statusStyles = {
  "within-limits": { bg: "bg-accent-green/10", text: "text-accent-green", label: "Within limits" },
  "near-stop": { bg: "bg-accent-amber/10", text: "text-accent-amber", label: "Near stop" },
  "stop-triggered": { bg: "bg-accent-red/10", text: "text-accent-red", label: "Stop hit" },
  "take-profit": { bg: "bg-accent-blue/10", text: "text-accent-blue", label: "TP hit" },
} as const;

function fmt(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(2)}`;
}

function getRiskStatus(pos: PositionEntry, currentPrice: number) {
  if (pos.takeProfit && currentPrice >= pos.takeProfit) return "take-profit";
  if (pos.stopLoss && currentPrice <= pos.stopLoss) return "stop-triggered";
  if (pos.stopLoss) {
    const distPct = ((currentPrice - pos.stopLoss) / currentPrice) * 100;
    if (distPct < 2) return "near-stop";
  }
  return "within-limits";
}

// ─── Add Position Modal ──────────────────────────────────

function AddPositionModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { ticker: string; shares: number; entryPrice: number; stopLoss: number | null; takeProfit: number | null; notes: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [shares, setShares] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [notes, setNotes] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search ticker
  useEffect(() => {
    if (!query.trim() || selectedTicker) {
      setResults([]);
      setShowResults(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowResults(true);
        }
      } catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedTicker]);

  // Fetch current price when ticker selected
  useEffect(() => {
    if (!selectedTicker) return;
    fetch(`/api/quotes?symbols=${selectedTicker}`)
      .then((r) => r.json())
      .then((data) => {
        const q = data.quotes?.[0];
        if (q && !entryPrice) setEntryPrice(q.price.toFixed(2));
      })
      .catch(() => {});
  }, [selectedTicker]);

  const selectTicker = (symbol: string, name: string) => {
    setSelectedTicker(symbol);
    setSelectedName(name);
    setQuery(symbol);
    setShowResults(false);
  };

  const clearTicker = () => {
    setSelectedTicker("");
    setSelectedName("");
    setQuery("");
    setEntryPrice("");
  };

  const handleSubmit = () => {
    if (!selectedTicker || !shares || !entryPrice) return;
    onAdd({
      ticker: selectedTicker,
      shares: parseFloat(shares),
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      notes,
    });
    // Reset
    clearTicker();
    setShares("");
    setStopLoss("");
    setTakeProfit("");
    setNotes("");
    onClose();
  };

  if (!open) return null;

  const totalCost = shares && entryPrice ? (parseFloat(shares) * parseFloat(entryPrice)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-white/[0.06] rounded-2xl w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold">Add position</h3>
          <p className="text-sm text-t-muted mt-1">Track a new position in your portfolio</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Ticker search */}
          <div ref={searchRef} className="relative">
            <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Ticker</label>
            {selectedTicker ? (
              <div className="flex items-center gap-3 bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5">
                <span className="font-mono font-bold text-t-primary">{selectedTicker}</span>
                <span className="text-sm text-t-muted flex-1">{selectedName}</span>
                <button onClick={clearTicker} className="text-t-muted hover:text-accent-red">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-t-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search ticker or company name…"
                    className="w-full bg-surface border border-white/[0.06] rounded-lg pl-9 pr-4 py-2.5 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-3.5 h-3.5 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {showResults && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-white/[0.06] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[200px] overflow-y-auto">
                    {results.map((r) => (
                      <button
                        key={r.symbol}
                        onClick={() => selectTicker(r.symbol, r.description)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <span className="font-mono font-semibold text-sm text-t-primary w-16">{r.symbol}</span>
                        <span className="text-sm text-t-secondary truncate flex-1">{r.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Shares + Entry price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Shares / Units</label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="10"
                step="any"
                className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Entry price ($)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="185.00"
                step="any"
                className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Stop loss + Take profit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Stop loss ($) <span className="normal-case text-t-muted/50">optional</span></label>
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="170.00"
                step="any"
                className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-red/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Take profit ($) <span className="normal-case text-t-muted/50">optional</span></label>
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="210.00"
                step="any"
                className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-primary placeholder:text-t-muted focus:outline-none focus:border-accent-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Notes <span className="normal-case text-t-muted/50">optional</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Earnings play, swing trade, etc."
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-secondary placeholder:text-t-muted focus:outline-none focus:border-white/10"
            />
          </div>

          {/* Total cost preview */}
          {totalCost > 0 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 flex items-center justify-between">
              <span className="text-xs text-t-muted uppercase tracking-wider">Total cost</span>
              <span className="font-mono font-semibold text-t-primary">{fmt(totalCost)}</span>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/[0.06] flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm text-t-secondary hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTicker || !shares || !entryPrice}
            className="px-5 py-2.5 bg-accent-green/10 border border-accent-green/20 rounded-lg text-sm font-medium text-accent-green hover:bg-accent-green/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add position
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Close Position Modal ────────────────────────────────

function ClosePositionModal({
  position,
  currentPrice,
  onClose,
  onConfirm,
}: {
  position: PositionEntry | null;
  currentPrice: number;
  onClose: () => void;
  onConfirm: (exitPrice: number) => void;
}) {
  const [exitPrice, setExitPrice] = useState("");

  useEffect(() => {
    if (currentPrice > 0) setExitPrice(currentPrice.toFixed(2));
  }, [currentPrice]);

  if (!position) return null;

  const ep = parseFloat(exitPrice) || 0;
  const pnl = (ep - position.entryPrice) * position.shares;
  const pnlPct = ((ep - position.entryPrice) / position.entryPrice) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-white/[0.06] rounded-2xl w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-semibold">Close {position.ticker}</h3>
          <p className="text-sm text-t-muted mt-1">{position.shares} shares @ {fmt(position.entryPrice)} entry</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] text-t-muted uppercase tracking-wider block mb-1.5">Exit price ($)</label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="any"
              className="w-full bg-surface border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-t-primary focus:outline-none focus:border-accent-green/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              autoFocus
            />
          </div>

          {ep > 0 && (
            <div className="bg-surface border border-white/[0.06] rounded-lg p-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-t-muted uppercase tracking-wider">P&L</div>
                <div className={`font-mono font-semibold mt-1 ${pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {pnl >= 0 ? "+" : ""}{fmt(pnl)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-t-muted uppercase tracking-wider">Return</div>
                <div className={`font-mono font-semibold mt-1 ${pnlPct >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                  {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/[0.06] flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm text-t-secondary hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => ep > 0 && onConfirm(ep)}
            disabled={!ep}
            className={`px-5 py-2.5 border rounded-lg text-sm font-medium transition-colors disabled:opacity-30 ${
              pnl >= 0
                ? "bg-accent-green/10 border-accent-green/20 text-accent-green hover:bg-accent-green/15"
                : "bg-accent-red/10 border-accent-red/20 text-accent-red hover:bg-accent-red/15"
            }`}
          >
            Close position
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function PositionsPage() {
  const { positions, closed, openPosition, closePosition, count } = usePositions();
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [showAddModal, setShowAddModal] = useState(false);
  const [closingPos, setClosingPos] = useState<PositionEntry | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  // Fetch live quotes for all open positions
  const fetchQuotes = useCallback(async () => {
    if (positions.length === 0) return;
    const symbols = positions.map((p) => p.ticker).join(",");
    try {
      const res = await fetch(`/api/quotes?symbols=${symbols}`);
      if (!res.ok) return;
      const data = await res.json();
      const map = new Map<string, Quote>();
      for (const q of data.quotes || []) map.set(q.symbol, q);
      setQuotes(map);
    } catch { /* keep existing */ }
  }, [positions]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  // ─── Computed values ───────────────────────────────────

  const positionsWithData = positions.map((pos) => {
    const quote = quotes.get(pos.ticker);
    const currentPrice = quote?.price ?? pos.entryPrice;
    const pnl = (currentPrice - pos.entryPrice) * pos.shares;
    const pnlPercent = ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100;
    const marketValue = currentPrice * pos.shares;
    const riskStatus = getRiskStatus(pos, currentPrice);
    return { ...pos, currentPrice, pnl, pnlPercent, marketValue, riskStatus, quote };
  });

  const totalValue = positionsWithData.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = positions.reduce((s, p) => s + p.entryPrice * p.shares, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const profitable = positionsWithData.filter((p) => p.pnl > 0).length;
  const atRisk = positionsWithData.filter((p) => p.riskStatus !== "within-limits").length;

  // Allocation by ticker
  const allocations = positionsWithData.map((p) => ({
    ticker: p.ticker,
    pct: totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0,
    value: p.marketValue,
  }));

  // Risk alerts
  const alerts: { level: "info" | "warning" | "danger"; title: string; detail: string }[] = [];
  for (const p of positionsWithData) {
    if (p.riskStatus === "stop-triggered") {
      alerts.push({
        level: "danger",
        title: `${p.ticker} stop-loss triggered`,
        detail: `Current: ${fmt(p.currentPrice)} | Stop: ${fmt(p.stopLoss!)} — P&L: ${p.pnlPercent >= 0 ? "+" : ""}${p.pnlPercent.toFixed(1)}%`,
      });
    } else if (p.riskStatus === "near-stop") {
      const dist = p.stopLoss ? ((p.currentPrice - p.stopLoss) / p.currentPrice * 100).toFixed(1) : "?";
      alerts.push({
        level: "warning",
        title: `${p.ticker} approaching stop-loss`,
        detail: `Current: ${fmt(p.currentPrice)} | Stop: ${fmt(p.stopLoss!)} (${dist}% away)`,
      });
    } else if (p.riskStatus === "take-profit") {
      alerts.push({
        level: "info",
        title: `${p.ticker} take-profit reached`,
        detail: `Current: ${fmt(p.currentPrice)} | TP: ${fmt(p.takeProfit!)} — Consider closing`,
      });
    }
  }

  // Largest position concentration warning
  const largest = allocations.sort((a, b) => b.pct - a.pct)[0];
  if (largest && largest.pct > 40 && positions.length > 1) {
    alerts.push({
      level: "info",
      title: `${largest.ticker} is ${largest.pct.toFixed(0)}% of portfolio`,
      detail: "Consider diversifying to reduce concentration risk.",
    });
  }

  const ALLOC_COLORS = [
    "bg-accent-green", "bg-accent-blue", "bg-accent-amber",
    "bg-accent-red", "bg-purple-500", "bg-cyan-500", "bg-orange-500", "bg-t-muted",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Positions</h2>
          <p className="text-sm text-t-muted mt-1">Your open positions and portfolio overview</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 bg-accent-green/10 border border-accent-green/20 rounded-lg text-sm font-medium text-accent-green hover:bg-accent-green/15 transition-colors flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          Add position
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Portfolio value</div>
          <div className="text-[24px] font-semibold font-mono">{totalValue > 0 ? fmt(totalValue) : "$0.00"}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Total P&L</div>
          <div className={`text-[24px] font-semibold font-mono ${totalPnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {totalPnl >= 0 ? "+" : ""}{fmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Profitable</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">
            {profitable}/{count}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">At risk</div>
          <div className={`text-[24px] font-semibold font-mono ${atRisk > 0 ? "text-accent-amber" : "text-accent-green"}`}>
            {atRisk}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 max-lg:grid-cols-1">
        {/* Positions table */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[15px] font-semibold">Open positions</div>
            {closed.length > 0 && (
              <button
                onClick={() => setShowClosed(!showClosed)}
                className="text-xs text-t-muted hover:text-t-secondary transition-colors"
              >
                {showClosed ? "Show open" : `${closed.length} closed`}
              </button>
            )}
          </div>

          {!showClosed ? (
            <>
              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-t-secondary">No open positions</p>
                  <p className="text-sm text-t-muted mt-1">Add a position to start tracking your portfolio</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_80px_80px_80px_90px_80px] gap-2 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
                    <span>Asset</span>
                    <span>Entry</span>
                    <span>Current</span>
                    <span>P&L</span>
                    <span>Value</span>
                    <span></span>
                  </div>

                  {positionsWithData.map((pos) => {
                    const status = statusStyles[pos.riskStatus as keyof typeof statusStyles];
                    return (
                      <div
                        key={pos.id}
                        className="grid grid-cols-[1fr_80px_80px_80px_90px_80px] gap-2 items-center py-4 border-b border-white/[0.06] last:border-b-0 text-[13px] hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-[14px]">{pos.ticker}</span>
                            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-t-muted mt-0.5">
                            {pos.shares} shares{pos.notes ? ` · ${pos.notes}` : ""}
                          </div>
                        </div>
                        <span className="text-t-secondary font-mono">{fmt(pos.entryPrice)}</span>
                        <span className="text-t-primary font-mono font-medium">{fmt(pos.currentPrice)}</span>
                        <div>
                          <div className={`font-mono font-medium ${pos.pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                            {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(1)}%
                          </div>
                          <div className={`font-mono text-[11px] opacity-60 ${pos.pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                            {pos.pnl >= 0 ? "+" : ""}{fmt(pos.pnl)}
                          </div>
                        </div>
                        <span className="text-t-secondary font-mono">{fmt(pos.marketValue)}</span>
                        <button
                          onClick={() => setClosingPos(pos)}
                          className="text-xs text-t-muted hover:text-accent-red border border-white/[0.06] hover:border-accent-red/20 rounded-md px-2.5 py-1.5 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            <>
              {/* Closed positions */}
              <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
                <span>Asset</span>
                <span>Entry</span>
                <span>Exit</span>
                <span>P&L</span>
                <span>Closed</span>
              </div>

              {closed.map((pos) => (
                <div
                  key={pos.id}
                  className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 items-center py-3.5 border-b border-white/[0.06] last:border-b-0 text-[13px]"
                >
                  <div>
                    <span className="font-mono font-medium">{pos.ticker}</span>
                    <span className="text-[11px] text-t-muted ml-2">{pos.shares} shares</span>
                  </div>
                  <span className="text-t-secondary font-mono">{fmt(pos.entryPrice)}</span>
                  <span className="text-t-primary font-mono">{fmt(pos.exitPrice)}</span>
                  <div className={`font-mono font-medium ${pos.pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                    {pos.pnlPercent >= 0 ? "+" : ""}{pos.pnlPercent.toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-t-muted">
                    {new Date(pos.closedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Sidebar: Allocation + Risk */}
        <div className="flex flex-col gap-6">
          {/* Allocation */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Portfolio allocation</div>

            {positions.length === 0 ? (
              <p className="text-sm text-t-muted text-center py-4">No positions yet</p>
            ) : (
              <>
                <div className="flex h-3 rounded-full overflow-hidden mb-4">
                  {allocations.map((a, i) => (
                    <div
                      key={a.ticker}
                      className={ALLOC_COLORS[i % ALLOC_COLORS.length]}
                      style={{ width: `${a.pct}%` }}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {allocations.map((a, i) => (
                    <div key={a.ticker} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`} />
                        <span className="text-t-secondary font-mono">{a.ticker}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-t-muted text-[12px]">{fmt(a.value)}</span>
                        <span className="font-mono font-medium w-12 text-right">{a.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Risk alerts */}
          <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
            <div className="text-[15px] font-semibold mb-4">Risk alerts</div>

            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-accent-green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {positions.length === 0 ? "Add positions to see risk alerts" : "All positions within limits"}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {alerts.map((alert, i) => (
                  <RiskAlert key={i} {...alert} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPositionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => openPosition(data)}
      />
      <ClosePositionModal
        position={closingPos}
        currentPrice={closingPos ? (quotes.get(closingPos.ticker)?.price ?? closingPos.entryPrice) : 0}
        onClose={() => setClosingPos(null)}
        onConfirm={(exitPrice) => {
          if (closingPos) closePosition(closingPos.id, exitPrice);
          setClosingPos(null);
        }}
      />
    </div>
  );
}

function RiskAlert({ level, title, detail }: { level: "info" | "warning" | "danger"; title: string; detail: string }) {
  const styles = {
    info: "border-accent-blue/20 bg-accent-blue/5",
    warning: "border-accent-amber/20 bg-accent-amber/5",
    danger: "border-accent-red/20 bg-accent-red/5",
  };
  const iconColors = { info: "text-accent-blue", warning: "text-accent-amber", danger: "text-accent-red" };

  return (
    <div className={`border rounded-lg p-3.5 ${styles[level]}`}>
      <div className="flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`flex-shrink-0 mt-0.5 ${iconColors[level]}`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <div className="text-[13px] font-medium">{title}</div>
          <div className="text-[12px] text-t-secondary mt-0.5">{detail}</div>
        </div>
      </div>
    </div>
  );
}
