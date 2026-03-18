"use client";

import { useRef, useEffect, useState, useCallback } from "react";

type CandleData = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

const RANGES = ["1W", "1M", "3M", "6M", "1Y"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Record<Range, number> = {
  "1W": 10,
  "1M": 35,
  "3M": 100,
  "6M": 200,
  "1Y": 370,
};

export default function PriceChart({
  ticker,
  basePrice,
  direction,
}: {
  ticker: string;
  basePrice: number;
  direction: "buy" | "sell" | "hold";
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  const [range, setRange] = useState<Range>("1M");
  const [allCandles, setAllCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real candle data from our API
  useEffect(() => {
    let cancelled = false;

    async function fetchCandles() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/candles?symbol=${encodeURIComponent(ticker)}&days=370`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        if (cancelled) return;

        if (data.candles && data.candles.length > 0) {
          setAllCandles(data.candles);
        } else {
          setError("No chart data available for this ticker");
          setAllCandles([]);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load chart data");
          setAllCandles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCandles();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  // Slice candles to match selected range
  const data = (() => {
    if (allCandles.length === 0) return [];
    const days = RANGE_DAYS[range];
    return allCandles.slice(-days);
  })();

  const initChart = useCallback(async () => {
    const container = chartContainerRef.current;
    if (!container || data.length === 0) return;

    const lc = await import("lightweight-charts");

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = lc.createChart(container, {
      width: container.clientWidth,
      height: 260,
      layout: {
        background: { type: lc.ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.25)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.15)", width: 1, style: 2 },
        horzLine: { color: "rgba(255,255,255,0.15)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(lc.CandlestickSeries, {
      upColor: "#22D68A",
      downColor: "#F0564A",
      borderUpColor: "#22D68A",
      borderDownColor: "#F0564A",
      wickUpColor: "#22D68A",
      wickDownColor: "#F0564A",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    series.setData(data);
    chart.timeScale().fitContent();
  }, [data]);

  // Create/update chart when data changes
  useEffect(() => {
    if (data.length === 0) return;

    initChart();

    const container = chartContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [initChart, data]);

  const dirLabel =
    direction === "buy" ? "Bullish trend" : direction === "sell" ? "Bearish trend" : "Neutral";
  const dirColor =
    direction === "buy"
      ? "text-accent-green"
      : direction === "sell"
        ? "text-accent-red"
        : "text-accent-amber";

  // Calculate actual price change from candle data for the selected range
  const rangeChange = data.length >= 2
    ? ((data[data.length - 1].close - data[0].open) / data[0].open) * 100
    : 0;

  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-t-muted uppercase tracking-wider">Price action</span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${direction === "buy" ? "bg-accent-green/10" : direction === "sell" ? "bg-accent-red/10" : "bg-accent-amber/10"} ${dirColor}`}
          >
            {dirLabel}
          </span>
          {data.length >= 2 && (
            <span
              className={`text-[10px] font-mono ${rangeChange >= 0 ? "text-accent-green" : "text-accent-red"}`}
            >
              {rangeChange >= 0 ? "+" : ""}{rangeChange.toFixed(2)}% ({range})
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                range === r
                  ? "bg-white/[0.08] text-t-primary"
                  : "text-t-muted hover:text-t-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="w-full h-[260px] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-accent-green/30 border-t-accent-green rounded-full animate-spin" />
            <span className="text-xs text-t-muted">Loading real market data…</span>
          </div>
        </div>
      ) : error ? (
        <div className="w-full h-[260px] flex items-center justify-center">
          <span className="text-xs text-t-muted">{error}</span>
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full" />
      )}
    </div>
  );
}
