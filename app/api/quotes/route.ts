import { NextResponse } from "next/server";

type Quote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const STOCK_SYMBOLS = ["NVDA", "TSLA", "XOM", "AAPL", "AMZN", "MSFT"];
const CRYPTO_IDS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
};

async function fetchStockQuotes(): Promise<Quote[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return [];

  const quotes: Quote[] = [];

  // Fetch all stock quotes in parallel
  const promises = STOCK_SYMBOLS.map(async (symbol) => {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { next: { revalidate: 30 } } // Cache for 30 seconds
      );
      if (!res.ok) return null;
      const data = await res.json();

      // Finnhub returns: c = current, d = change, dp = change percent
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
  });

  const results = await Promise.all(promises);
  results.forEach((r) => {
    if (r) quotes.push(r);
  });

  return quotes;
}

async function fetchCryptoQuotes(): Promise<Quote[]> {
  const quotes: Quote[] = [];

  try {
    const ids = Object.keys(CRYPTO_IDS).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    for (const [id, symbol] of Object.entries(CRYPTO_IDS)) {
      if (data[id]) {
        const price = data[id].usd;
        const changePercent = data[id].usd_24h_change || 0;
        const change = (price * changePercent) / 100;
        quotes.push({
          symbol,
          price,
          change,
          changePercent,
        });
      }
    }
  } catch {
    // Silently fail — we'll return what we have
  }

  return quotes;
}

export async function GET() {
  try {
    const [stocks, crypto] = await Promise.all([
      fetchStockQuotes(),
      fetchCryptoQuotes(),
    ]);

    const allQuotes = [...stocks, ...crypto];

    // Sort: put them in a nice display order
    const order = ["NVDA", "BTC", "TSLA", "ETH", "AAPL", "XOM", "AMZN", "MSFT"];
    allQuotes.sort(
      (a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol)
    );

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
