import { NextResponse } from "next/server";

type FinnhubArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

export type NewsArticle = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  time: string;
  timestamp: number;
  category: "earnings" | "geopolitical" | "macro" | "regulatory" | "general";
  sentiment: number;
  affectedAssets: string[];
};

// Basic keyword-based sentiment scoring
// This is a placeholder — will be replaced by Claude NLP engine later
function scoreSentiment(headline: string, summary: string): number {
  const text = `${headline} ${summary}`.toLowerCase();

  const bullish = [
    "surge", "soar", "jump", "rally", "gain", "rise", "beat",
    "exceed", "record", "high", "boost", "upgrade", "growth",
    "profit", "revenue up", "bullish", "optimistic", "recovery",
    "expansion", "positive", "strong", "outperform", "buy",
  ];
  const bearish = [
    "crash", "plunge", "fall", "drop", "decline", "miss", "cut",
    "warning", "risk", "fear", "loss", "layoff", "recession",
    "bearish", "investigation", "lawsuit", "sanction", "tension",
    "conflict", "negative", "weak", "downgrade", "sell", "slump",
  ];

  let score = 0;
  bullish.forEach((word) => {
    if (text.includes(word)) score += 0.15;
  });
  bearish.forEach((word) => {
    if (text.includes(word)) score -= 0.15;
  });

  // Clamp between -1 and 1
  return Math.max(-1, Math.min(1, Math.round(score * 100) / 100));
}

// Categorize articles based on content
function categorize(headline: string, summary: string): NewsArticle["category"] {
  const text = `${headline} ${summary}`.toLowerCase();

  if (
    text.includes("earnings") || text.includes("revenue") ||
    text.includes("profit") || text.includes("quarterly") ||
    text.includes("eps") || text.includes("fiscal")
  ) return "earnings";

  if (
    text.includes("fed") || text.includes("rate") ||
    text.includes("inflation") || text.includes("gdp") ||
    text.includes("employment") || text.includes("cpi") ||
    text.includes("treasury") || text.includes("central bank")
  ) return "macro";

  if (
    text.includes("sec") || text.includes("regulation") ||
    text.includes("compliance") || text.includes("ruling") ||
    text.includes("investigation") || text.includes("law")
  ) return "regulatory";

  if (
    text.includes("war") || text.includes("sanction") ||
    text.includes("geopolit") || text.includes("tension") ||
    text.includes("tariff") || text.includes("trade war") ||
    text.includes("opec") || text.includes("nato") ||
    text.includes("election") || text.includes("conflict")
  ) return "geopolitical";

  return "general";
}

// Extract likely affected ticker symbols from the article
function extractAssets(headline: string, related: string): string[] {
  const assets: string[] = [];

  // Finnhub provides a "related" field with tickers
  if (related) {
    related.split(",").forEach((ticker) => {
      const t = ticker.trim().toUpperCase();
      if (t && t.length <= 5) assets.push(t);
    });
  }

  // Also check headline for common tickers
  const knownTickers = [
    "NVDA", "TSLA", "AAPL", "AMZN", "MSFT", "GOOGL", "META",
    "AMD", "INTC", "XOM", "CVX", "BTC", "ETH", "CL", "GLD",
  ];
  const upper = headline.toUpperCase();
  knownTickers.forEach((ticker) => {
    if (upper.includes(ticker) && !assets.includes(ticker)) {
      assets.push(ticker);
    }
  });

  return assets.slice(0, 5); // Max 5 assets
}

function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { articles: [], error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch general market news
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
      { next: { revalidate: 120 } } // Cache for 2 minutes
    );

    if (!res.ok) {
      return NextResponse.json(
        { articles: [], error: "Failed to fetch from Finnhub" },
        { status: 502 }
      );
    }

    const raw: FinnhubArticle[] = await res.json();

    // Process and score articles
    const articles: NewsArticle[] = raw
      .slice(0, 20) // Limit to 20 articles
      .map((article) => ({
        id: `fn-${article.id}`,
        headline: article.headline,
        summary: article.summary?.slice(0, 200) || "",
        source: article.source,
        url: article.url,
        time: timeAgo(article.datetime),
        timestamp: article.datetime,
        category: categorize(article.headline, article.summary || ""),
        sentiment: scoreSentiment(article.headline, article.summary || ""),
        affectedAssets: extractAssets(article.headline, article.related || ""),
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first

    return NextResponse.json({
      articles,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { articles: [], error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
