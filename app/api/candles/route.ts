import { NextResponse } from "next/server";

type CandleResult = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Map short crypto tickers to Yahoo Finance format
const CRYPTO_YAHOO_MAP: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  XRP: "XRP-USD",
  DOGE: "DOGE-USD",
  ADA: "ADA-USD",
  DOT: "DOT-USD",
  AVAX: "AVAX-USD",
  MATIC: "MATIC-USD",
  LINK: "LINK-USD",
  BNB: "BNB-USD",
  LTC: "LTC-USD",
  SHIB: "SHIB-USD",
  UNI: "UNI-USD",
  ATOM: "ATOM-USD",
};

// Map short crypto tickers to Finnhub format (BINANCE:BTCUSDT)
const CRYPTO_FINNHUB_MAP: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  XRP: "BINANCE:XRPUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  ADA: "BINANCE:ADAUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  LINK: "BINANCE:LINKUSDT",
  BNB: "BINANCE:BNBUSDT",
  LTC: "BINANCE:LTCUSDT",
};

function isCrypto(symbol: string): boolean {
  return symbol in CRYPTO_YAHOO_MAP;
}

// Range string → Yahoo Finance interval & range params
const YAHOO_RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "7": { range: "10d", interval: "1d" },
  "30": { range: "1mo", interval: "1d" },
  "90": { range: "3mo", interval: "1d" },
  "180": { range: "6mo", interval: "1d" },
  "365": { range: "1y", interval: "1d" },
  "370": { range: "1y", interval: "1d" },
};

async function fetchFromFinnhub(symbol: string, days: number, apiKey: string): Promise<CandleResult[] | null> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${now}&token=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.s !== "ok" || !data.t) return null;

    return data.t.map((timestamp: number, i: number) => {
      const d = new Date(timestamp * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        time: `${yyyy}-${mm}-${dd}`,
        open: +data.o[i].toFixed(2),
        high: +data.h[i].toFixed(2),
        low: +data.l[i].toFixed(2),
        close: +data.c[i].toFixed(2),
      };
    });
  } catch {
    return null;
  }
}

async function fetchFromYahoo(symbol: string, days: number): Promise<CandleResult[] | null> {
  // Pick the closest range
  const keys = Object.keys(YAHOO_RANGE_MAP).map(Number).sort((a, b) => a - b);
  const matchKey = keys.find((k) => k >= days) || keys[keys.length - 1];
  const { range, interval } = YAHOO_RANGE_MAP[String(matchKey)];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    if (!quote) return null;

    const candles: CandleResult[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];

      // Skip any null entries (market holidays, etc.)
      if (o == null || h == null || l == null || c == null) continue;

      const d = new Date(timestamps[i] * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      candles.push({
        time: `${yyyy}-${mm}-${dd}`,
        open: +o.toFixed(2),
        high: +h.toFixed(2),
        low: +l.toFixed(2),
        close: +c.toFixed(2),
      });
    }

    return candles.length > 0 ? candles : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const days = parseInt(searchParams.get("days") || "90", 10);

  if (!symbol) {
    return NextResponse.json({ candles: [], error: "Symbol required" }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY || "";
  const crypto = isCrypto(symbol);

  // Resolve the correct symbol for each provider
  const finnhubSymbol = crypto ? (CRYPTO_FINNHUB_MAP[symbol] || symbol) : symbol;
  const yahooSymbol = crypto ? (CRYPTO_YAHOO_MAP[symbol] || symbol) : symbol;

  // Try Finnhub first, then fallback to Yahoo Finance
  let candles = apiKey ? await fetchFromFinnhub(finnhubSymbol, days, apiKey) : null;

  if (!candles || candles.length === 0) {
    candles = await fetchFromYahoo(yahooSymbol, days);
  }

  if (!candles || candles.length === 0) {
    return NextResponse.json({
      candles: [],
      symbol,
      error: "No chart data available",
    });
  }

  return NextResponse.json({ candles, symbol });
}
