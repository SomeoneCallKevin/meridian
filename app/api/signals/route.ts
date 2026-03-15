import { NextResponse } from "next/server";

type QuoteData = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

type NewsAnalysis = {
  headline: string;
  sentiment: number;
  urgency: "high" | "med" | "low";
  category: string;
  confidence: number;
  nlpSummary: string;
  assetImpacts: { ticker: string; direction: string; impact: number }[];
  causalChain: string[];
  source: string;
  time: string;
};

export type GeneratedSignal = {
  id: string;
  ticker: string;
  direction: "buy" | "sell" | "hold";
  reason: string;
  confidence: number;
  urgency: "high" | "med" | "low";
  sentiment: number;
  sources: string[];
  timestamp: string;
  priceData: {
    price: number;
    change: number;
    changePercent: number;
  } | null;
  newsCount: number;
  topNews: { headline: string; sentiment: number; source: string }[];
  causalChain: string[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const analyses: NewsAnalysis[] = body.analyses || [];
    const quotes: QuoteData[] = body.quotes || [];

    if (analyses.length === 0) {
      return NextResponse.json({ signals: [], message: "No analyzed articles provided" });
    }

    // Build a map of quotes for quick lookup
    const quoteMap = new Map<string, QuoteData>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    // Group news by affected ticker
    const tickerNews = new Map<
      string,
      {
        sentiments: number[];
        impacts: number[];
        directions: string[];
        urgencies: string[];
        confidences: number[];
        headlines: { headline: string; sentiment: number; source: string }[];
        causalChains: string[][];
        categories: string[];
        sources: Set<string>;
      }
    >();

    for (const article of analyses) {
      if (!article.assetImpacts) continue;

      for (const impact of article.assetImpacts) {
        const ticker = impact.ticker.toUpperCase();

        if (!tickerNews.has(ticker)) {
          tickerNews.set(ticker, {
            sentiments: [],
            impacts: [],
            directions: [],
            urgencies: [],
            confidences: [],
            headlines: [],
            causalChains: [],
            categories: [],
            sources: new Set(),
          });
        }

        const data = tickerNews.get(ticker)!;
        data.sentiments.push(article.sentiment * impact.impact);
        data.impacts.push(impact.impact);
        data.directions.push(impact.direction);
        data.urgencies.push(article.urgency);
        data.confidences.push(article.confidence);
        data.headlines.push({
          headline: article.headline,
          sentiment: article.sentiment,
          source: article.source,
        });
        if (article.causalChain) {
          data.causalChains.push(article.causalChain);
        }
        data.categories.push(article.category);
        data.sources.add("News NLP");

        // Add source type based on category
        if (article.category === "geopolitical") data.sources.add("Geopolitical");
        if (article.category === "macro") data.sources.add("Macro");
        if (article.category === "earnings") data.sources.add("Earnings");
      }
    }

    // Generate signals for each ticker
    const signals: GeneratedSignal[] = [];

    for (const [ticker, data] of tickerNews.entries()) {
      // Calculate weighted average sentiment
      const totalWeight = data.impacts.reduce((a, b) => a + b, 0);
      const weightedSentiment =
        totalWeight > 0
          ? data.sentiments.reduce((a, b) => a + b, 0) / totalWeight
          : 0;

      // Determine direction
      let direction: "buy" | "sell" | "hold";
      if (weightedSentiment > 0.2) direction = "buy";
      else if (weightedSentiment < -0.2) direction = "sell";
      else direction = "hold";

      // Factor in price momentum if we have quote data
      const quote = quoteMap.get(ticker);
      const sources = Array.from(data.sources);

      if (quote) {
        // Price confirms news direction = higher confidence
        const priceConfirms =
          (direction === "buy" && quote.changePercent > 0) ||
          (direction === "sell" && quote.changePercent < 0);

        if (priceConfirms) sources.push("Price action");

        // Price contradicts news = lower confidence, might flip to hold
        const priceContradicts =
          (direction === "buy" && quote.changePercent < -2) ||
          (direction === "sell" && quote.changePercent > 2);

        if (priceContradicts && Math.abs(weightedSentiment) < 0.4) {
          direction = "hold";
        }
      }

      // Calculate confidence (0-100)
      const avgConfidence =
        data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length;
      const newsCountBoost = Math.min(data.headlines.length * 5, 15);
      const sourceBoost = sources.length * 5;
      const confidence = Math.min(
        100,
        Math.round(avgConfidence * 70 + newsCountBoost + sourceBoost)
      );

      // Determine urgency (highest urgency from any related article)
      let urgency: "high" | "med" | "low" = "low";
      if (data.urgencies.includes("high")) urgency = "high";
      else if (data.urgencies.includes("med")) urgency = "med";

      // Build reason from top headlines
      const topHeadline = data.headlines.sort(
        (a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment)
      )[0];

      // Merge causal chains — take the best one
      const bestChain = data.causalChains.sort(
        (a, b) => b.length - a.length
      )[0] || [];

      const signal: GeneratedSignal = {
        id: `live-${ticker}-${Date.now()}`,
        ticker,
        direction,
        reason: topHeadline
          ? topHeadline.headline.slice(0, 80)
          : `${direction === "buy" ? "Bullish" : direction === "sell" ? "Bearish" : "Mixed"} signals`,
        confidence,
        urgency,
        sentiment: Math.round(weightedSentiment * 100) / 100,
        sources,
        timestamp: "just now",
        priceData: quote
          ? {
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
            }
          : null,
        newsCount: data.headlines.length,
        topNews: data.headlines.slice(0, 3),
        causalChain: bestChain,
      };

      signals.push(signal);
    }

    // Sort by confidence descending
    signals.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      signals,
      generatedAt: new Date().toISOString(),
      articleCount: analyses.length,
    });
  } catch (error) {
    console.error("Signal generation error:", error);
    return NextResponse.json(
      { signals: [], error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
