"use client";

import { useRef, useEffect, useMemo } from "react";

type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

function generateCandles(ticker: string, basePrice: number, days: number): Candle[] {
  const rand = seededRandom(ticker);
  const candles: Candle[] = [];
  let price = basePrice * (0.85 + rand() * 0.15);

  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const volatility = basePrice * 0.018;
    const drift = (rand() - 0.47) * volatility;
    const open = price;
    const close = open + drift;
    const wickUp = Math.abs(drift) * (0.3 + rand() * 1.2);
    const wickDown = Math.abs(drift) * (0.3 + rand() * 1.2);
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = 5_000_000 + rand() * 15_000_000;

    candles.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.round(volume),
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range>("1M");
  const hoveredRef = useRef<number>(-1);

  const allCandles = useMemo(() => generateCandles(ticker, basePrice, 90), [ticker, basePrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;

    function draw() {
      const W = container!.clientWidth;
      const H = 260;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;

      const ctx = canvas!.getContext("2d")!;
      ctx.scale(dpr, dpr);

      const range = rangeRef.current;
      const days = RANGE_DAYS[range];
      const candles = allCandles.slice(-days);
      if (candles.length === 0) return;

      const padL = 0;
      const padR = 55;
      const padT = 10;
      const padB = 28;
      const chartW = W - padL - padR;
      const chartH = H - padT - padB;

      const minPrice = Math.min(...candles.map((c) => c.low)) * 0.998;
      const maxPrice = Math.max(...candles.map((c) => c.high)) * 1.002;
      const priceRange = maxPrice - minPrice || 1;

      const candleW = chartW / candles.length;
      const bodyW = Math.max(1, candleW * 0.55);

      const yForPrice = (p: number) => padT + (1 - (p - minPrice) / priceRange) * chartH;

      // Clear
      ctx.clearRect(0, 0, W, H);

      // Grid lines
      const gridLines = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i <= gridLines; i++) {
        const y = padT + (chartH / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();

        const price = maxPrice - (priceRange / gridLines) * i;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.textAlign = "left";
        ctx.fillText(`$${price.toFixed(0)}`, W - padR + 6, y + 3.5);
      }

      // Candles
      const green = "#22D68A";
      const red = "#F0564A";

      candles.forEach((c, i) => {
        const x = padL + candleW * i + candleW / 2;
        const isBull = c.close >= c.open;
        const color = isBull ? green : red;

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yForPrice(c.high));
        ctx.lineTo(x, yForPrice(c.low));
        ctx.stroke();

        // Body
        const bodyTop = yForPrice(Math.max(c.open, c.close));
        const bodyBot = yForPrice(Math.min(c.open, c.close));
        const bodyH = Math.max(1, bodyBot - bodyTop);

        if (isBull) {
          ctx.fillStyle = color;
          ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH);
        }

        // Hover highlight
        if (hoveredRef.current === i) {
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x, padT);
          ctx.lineTo(x, padT + chartH);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Date labels
      const labelInterval = Math.max(1, Math.floor(candles.length / 6));
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      candles.forEach((c, i) => {
        if (i % labelInterval === 0 || i === candles.length - 1) {
          const x = padL + candleW * i + candleW / 2;
          ctx.fillText(c.date, x, H - 6);
        }
      });
    }

    draw();

    const onResize = () => draw();
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Hover handler
    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const range = rangeRef.current;
      const days = RANGE_DAYS[range];
      const candles = allCandles.slice(-days);
      const padL = 0;
      const padR = 55;
      const chartW = container!.clientWidth - padL - padR;
      const candleW = chartW / candles.length;
      const idx = Math.floor((mx - padL) / candleW);

      if (idx >= 0 && idx < candles.length) {
        hoveredRef.current = idx;
        const c = candles[idx];
        const tooltip = tooltipRef.current;
        if (tooltip) {
          const isBull = c.close >= c.open;
          tooltip.style.opacity = "1";
          tooltip.innerHTML = `<span style="color:rgba(255,255,255,0.45)">${c.date}</span>&nbsp;&nbsp;O <span style="font-family:JetBrains Mono,monospace">${c.open.toFixed(2)}</span>&nbsp;&nbsp;H <span style="font-family:JetBrains Mono,monospace">${c.high.toFixed(2)}</span>&nbsp;&nbsp;L <span style="font-family:JetBrains Mono,monospace">${c.low.toFixed(2)}</span>&nbsp;&nbsp;C <span style="color:${isBull ? "#22D68A" : "#F0564A"};font-family:JetBrains Mono,monospace">${c.close.toFixed(2)}</span>`;
        }
      } else {
        hoveredRef.current = -1;
        if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      }
      draw();
    }

    function onLeave() {
      hoveredRef.current = -1;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
      draw();
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [allCandles]);

  function setRange(r: Range) {
    rangeRef.current = r;
    hoveredRef.current = -1;
    if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
    // Force re-render
    const canvas = canvasRef.current;
    if (canvas) canvas.dispatchEvent(new Event("redraw"));
    // Trigger draw via resize observer workaround
    const container = containerRef.current;
    if (container) {
      container.style.width = container.clientWidth + "px";
      requestAnimationFrame(() => {
        container.style.width = "";
      });
    }
  }

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
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${direction === "buy" ? "bg-accent-green/10" : direction === "sell" ? "bg-accent-red/10" : "bg-accent-amber/10"} ${dirColor}`}>
            {dirLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                rangeRef.current === r
                  ? "bg-white/[0.08] text-t-primary"
                  : "text-t-muted hover:text-t-secondary"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={tooltipRef}
        className="text-[11px] text-t-secondary mb-2 h-4 transition-opacity"
        style={{ opacity: 0 }}
      />
      <div ref={containerRef} className="w-full">
        <canvas ref={canvasRef} className="w-full cursor-crosshair" />
      </div>
    </div>
  );
}
