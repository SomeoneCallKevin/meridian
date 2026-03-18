import { NextResponse } from "next/server";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const DEFAULT_STOCK_SYMBOLS = ["NVDA", "TSLA", "XOM", "AAPL", "AMZN", "MSFT"];
const CRYPTO_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
};
const CRYPTO_SYMBOLS = new Set(Object.keys(CRYPTO_MAP));

async function fetchStockQuote(symbol: string, apiKey: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.c && data.c > 0) {
      return {
        symbol,
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchStockQuotes(symbols: string[], apiKey: string): Promise<Quote[]> {
  const results = await Promise.all(symbols.map((s) => fetchStockQuote(s, apiKey)));
  return results.filter((r): r is Quote => r !== null);
}

async function fetchCryptoQuotes(symbols: string[]): Promise<Quote[]> {
  const quotes: Quote[] = [];
  const ids = symbols
    .filter((s) => CRYPTO_MAP[s])
    .map((s) => CRYPTO_MAP[s]);

  if (ids.length === 0) return [];

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    for (const [sym, coinId] of Object.entries(CRYPTO_MAP)) {
      if (!symbols.includes(sym)) continue;
      if (data[coinId]) {
        const price = data[coinId].usd;
        const changePercent = data[coinId].usd_24h_change || 0;
        const change = (price * changePercent) / 100;
        quotes.push({ symbol: sym, price, change, changePercent });
      }
    }
  } catch {
    // Silently fail
  }

  return quotes;
}

export async function GET(request: Request) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ quotes: [], error: "API key not configured" }, { status: 500 });
  }

  // Support ?symbols=NVDA,AAPL,BTC for custom ticker lists
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  let stockSymbols: string[];
  let cryptoSymbols: string[];

  if (symbolsParam) {
    const requested = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    stockSymbols = requested.filter((s) => !CRYPTO_SYMBOLS.has(s));
    cryptoSymbols = requested.filter((s) => CRYPTO_SYMBOLS.has(s));
  } else {
    stockSymbols = DEFAULT_STOCK_SYMBOLS;
    cryptoSymbols = Array.from(CRYPTO_SYMBOLS);
  }

  try {
    const [stocks, crypto] = await Promise.all([
      fetchStockQuotes(stockSymbols, apiKey),
      fetchCryptoQuotes(cryptoSymbols),
    ]);

    const allQuotes = [...stocks, ...crypto];

    // Sort: default order for standard tickers, then alphabetical for extras
    const defaultOrder = ["NVDA", "BTC", "TSLA", "ETH", "AAPL", "XOM", "AMZN", "MSFT"];
    allQuotes.sort((a, b) => {
      const ai = defaultOrder.indexOf(a.symbol);
      const bi = defaultOrder.indexOf(b.symbol);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.symbol.localeCompare(b.symbol);
    });

    return NextResponse.json({
      quotes: allQuotes,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { quotes: [], updatedAt: null, error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
