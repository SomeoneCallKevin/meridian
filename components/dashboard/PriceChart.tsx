"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";

type CandleData = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Deterministic PRNG seeded by ticker string
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 0xffffffff;
  };
}

function generateCandles(ticker: string, basePrice: number, days: number): CandleData[] {
  const rand = seededRandom(ticker);
  const candles: CandleData[] = [];
  let price = basePrice * (0.85 + rand() * 0.15);

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const volatility = basePrice * 0.018;
    const drift = (rand() - 0.47) * volatility;
    const open = price;
    const close = open + drift;
    const wickUp = Math.abs(drift) * (0.3 + rand() * 1.2);
    const wickDown = Math.abs(drift) * (0.3 + rand() * 1.2);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    candles.push({
      time: `${yyyy}-${mm}-${dd}`,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });
    price = close;
  }
  return candles;
}

const RANGES = ["1W", "1M", "3M"] as const;
type Range = (typeof RANGES)[number];
const RANGE_DAYS: Record<Range, number> = { "1W": 7, "1M": 30, "3M": 90 };

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

  const allCandles = useMemo(() => generateCandles(ticker, basePrice, 90), [ticker, basePrice]);

  const data = useMemo(() => {
    const days = RANGE_DAYS[range];
    return allCandles.slice(-days);
  }, [range, allCandles]);

  const initChart = useCallback(async () => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Dynamic import to avoid SSR issues
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

  // Create chart on mount
  useEffect(() => {
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
  }, [initChart]);

  const dirLabel =
    direction === "buy" ? "Bullish trend" : direction === "sell" ? "Bearish trend" : "Neutral";
  const dirColor =
    direction === "buy"
      ? "text-accent-green"
      : direction === "sell"
        ? "text-accent-red"
        : "text-accent-amber";

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
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
