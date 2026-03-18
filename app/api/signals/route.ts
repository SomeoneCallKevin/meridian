import { NextResponse } from "next/server";
import type { SignalSourceType, ExplainabilityStep } from "@/lib/types";

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

type SocialData = {
  ticker: string;
  mentions: number;
  avgSentiment: number;
  volumeChange: number;
};

type MacroData = {
  ticker: string;
  eventCount: number;
  avgImpact: number; // -1 to 1
  upcomingHighImpact: boolean;
};

// Source weights for the multi-signal aggregator
const SOURCE_WEIGHTS: Record<SignalSourceType, number> = {
  "news-nlp": 0.35,
  "technical": 0.20,
  "social": 0.15,
  "macro": 0.15,
  "geopolitical": 0.10,
  "price-action": 0.05,
};

type SourceContribution = {
  type: SignalSourceType;
  weight: number;
  sentiment: number;
  confidence: number;
  reasoning: string;
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
  sourceDetails: SourceContribution[];
  explainability: ExplainabilityStep[];
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
    const socialData: SocialData[] = body.socialData || [];
    const macroData: MacroData[] = body.macroData || [];

    if (analyses.length === 0) {
      return NextResponse.json({ signals: [], message: "No analyzed articles provided" });
    }

    const quoteMap = new Map<string, QuoteData>();
    quotes.forEach((q) => quoteMap.set(q.symbol, q));

    const socialMap = new Map<string, SocialData>();
    socialData.forEach((s) => socialMap.set(s.ticker, s));

    const macroMap = new Map<string, MacroData>();
    macroData.forEach((m) => macroMap.set(m.ticker, m));

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

        if (article.category === "geopolitical") data.sources.add("Geopolitical");
        if (article.category === "macro") data.sources.add("Macro");
        if (article.category === "earnings") data.sources.add("Earnings");
      }
    }

    // Generate signals with multi-source fusion
    const signals: GeneratedSignal[] = [];

    for (const [ticker, data] of tickerNews.entries()) {
      const sourceContributions: SourceContribution[] = [];
      const explainSteps: ExplainabilityStep[] = [];
      let stepOrder = 1;

      // ─── Source 1: News NLP ──────────────────────────────
      const totalWeight = data.impacts.reduce((a, b) => a + b, 0);
      const newsSentiment =
        totalWeight > 0
          ? data.sentiments.reduce((a, b) => a + b, 0) / totalWeight
          : 0;
      const newsConfidence =
        data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length;

      sourceContributions.push({
        type: "news-nlp",
        weight: SOURCE_WEIGHTS["news-nlp"],
        sentiment: newsSentiment,
        confidence: newsConfidence,
        reasoning: `${data.headlines.length} article(s) analyzed with avg sentiment ${newsSentiment.toFixed(2)}`,
      });

      explainSteps.push({
        order: stepOrder++,
        source: "news-nlp",
        observation: `NLP analysis of ${data.headlines.length} articles shows ${newsSentiment > 0.2 ? "bullish" : newsSentiment < -0.2 ? "bearish" : "neutral"} sentiment (${newsSentiment.toFixed(2)})`,
        impact: newsSentiment > 0.1 ? "supports" : newsSentiment < -0.1 ? "contradicts" : "neutral",
        weight: SOURCE_WEIGHTS["news-nlp"],
      });

      // ─── Source 2: Price Action ──────────────────────────
      const quote = quoteMap.get(ticker);
      const sourcesSet = new Set(Array.from(data.sources));

      if (quote) {
        const priceSignal = quote.changePercent > 0.5 ? 1 : quote.changePercent < -0.5 ? -1 : 0;
        const priceSentiment = quote.changePercent / 10; // Normalize

        sourceContributions.push({
          type: "price-action",
          weight: SOURCE_WEIGHTS["price-action"],
          sentiment: Math.max(-1, Math.min(1, priceSentiment)),
          confidence: Math.abs(quote.changePercent) > 2 ? 0.8 : 0.5,
          reasoning: `Price ${quote.changePercent > 0 ? "up" : "down"} ${Math.abs(quote.changePercent).toFixed(2)}%`,
        });

        const confirms =
          (newsSentiment > 0.2 && quote.changePercent > 0) ||
          (newsSentiment < -0.2 && quote.changePercent < 0);

        explainSteps.push({
          order: stepOrder++,
          source: "price-action",
          observation: `Price ${confirms ? "confirms" : "diverges from"} news sentiment (${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`,
          impact: confirms ? "supports" : priceSignal === 0 ? "neutral" : "contradicts",
          weight: SOURCE_WEIGHTS["price-action"],
        });

        if (confirms) sourcesSet.add("Price action");
      }

      // ─── Source 3: Social Signals ────────────────────────
      const social = socialMap.get(ticker);
      if (social) {
        sourceContributions.push({
          type: "social",
          weight: SOURCE_WEIGHTS["social"],
          sentiment: social.avgSentiment,
          confidence: Math.min(1, social.mentions / 500), // More mentions = more confident
          reasoning: `${social.mentions} mentions, sentiment ${social.avgSentiment.toFixed(2)}, volume ${social.volumeChange > 0 ? "+" : ""}${social.volumeChange.toFixed(0)}%`,
        });

        const socialConfirms =
          (newsSentiment > 0 && social.avgSentiment > 0) ||
          (newsSentiment < 0 && social.avgSentiment < 0);

        explainSteps.push({
          order: stepOrder++,
          source: "social",
          observation: `Social sentiment ${socialConfirms ? "aligns with" : "diverges from"} news (${social.avgSentiment.toFixed(2)}, ${social.mentions} mentions)`,
          impact: socialConfirms ? "supports" : "contradicts",
          weight: SOURCE_WEIGHTS["social"],
        });

        sourcesSet.add("Social");
      }

      // ─── Source 4: Macro Calendar ────────────────────────
      const macro = macroMap.get(ticker);
      if (macro) {
        sourceContributions.push({
          type: "macro",
          weight: SOURCE_WEIGHTS["macro"],
          sentiment: macro.avgImpact,
          confidence: macro.upcomingHighImpact ? 0.7 : 0.4,
          reasoning: `${macro.eventCount} upcoming macro event(s)${macro.upcomingHighImpact ? " including HIGH impact" : ""}`,
        });

        explainSteps.push({
          order: stepOrder++,
          source: "macro",
          observation: `${macro.eventCount} macro event(s) ahead${macro.upcomingHighImpact ? " — HIGH IMPACT event pending, increased uncertainty" : ""}`,
          impact: macro.upcomingHighImpact ? "contradicts" : "neutral",
          weight: SOURCE_WEIGHTS["macro"],
        });

        sourcesSet.add("Macro");
      }

      // ─── Source 5: Geopolitical (from news categories) ───
      const geoArticles = data.categories.filter((c) => c === "geopolitical");
      if (geoArticles.length > 0) {
        sourceContributions.push({
          type: "geopolitical",
          weight: SOURCE_WEIGHTS["geopolitical"],
          sentiment: newsSentiment, // Use same sentiment from geopolitical articles
          confidence: 0.6,
          reasoning: `${geoArticles.length} geopolitical article(s) detected`,
        });

        explainSteps.push({
          order: stepOrder++,
          source: "geopolitical",
          observation: `${geoArticles.length} geopolitical factor(s) influencing ${ticker}`,
          impact: newsSentiment > 0 ? "supports" : newsSentiment < 0 ? "contradicts" : "neutral",
          weight: SOURCE_WEIGHTS["geopolitical"],
        });
      }

      // ─── Multi-Signal Aggregation ────────────────────────
      // Weighted sentiment across all sources
      let totalSourceWeight = 0;
      let weightedSentiment = 0;
      let weightedConfidence = 0;

      for (const src of sourceContributions) {
        totalSourceWeight += src.weight;
        weightedSentiment += src.sentiment * src.weight;
        weightedConfidence += src.confidence * src.weight;
      }

      if (totalSourceWeight > 0) {
        weightedSentiment /= totalSourceWeight;
        weightedConfidence /= totalSourceWeight;
      }

      // Determine direction
      let direction: "buy" | "sell" | "hold";
      if (weightedSentiment > 0.2) direction = "buy";
      else if (weightedSentiment < -0.2) direction = "sell";
      else direction = "hold";

      // Price contradiction can flip to hold
      if (quote) {
        const priceContradicts =
          (direction === "buy" && quote.changePercent < -2) ||
          (direction === "sell" && quote.changePercent > 2);
        if (priceContradicts && Math.abs(weightedSentiment) < 0.4) {
          direction = "hold";
        }
      }

      // Final confidence score
      const newsCountBoost = Math.min(data.headlines.length * 5, 15);
      const sourceBoost = sourceContributions.length * 4;
      // Agreement bonus: if most sources agree, boost confidence
      const agreeing = sourceContributions.filter(
        (s) =>
          (direction === "buy" && s.sentiment > 0.1) ||
          (direction === "sell" && s.sentiment < -0.1) ||
          direction === "hold"
      ).length;
      const agreementBonus = (agreeing / sourceContributions.length) * 10;

      const confidence = Math.min(
        100,
        Math.round(weightedConfidence * 60 + newsCountBoost + sourceBoost + agreementBonus)
      );

      // Add final aggregation step
      explainSteps.push({
        order: stepOrder++,
        source: "news-nlp", // aggregation step
        observation: `Multi-source aggregation: ${sourceContributions.length} sources, ${agreeing}/${sourceContributions.length} agreeing → ${direction.toUpperCase()} at ${confidence}% confidence`,
        impact: "supports",
        weight: 1,
      });

      // Urgency
      let urgency: "high" | "med" | "low" = "low";
      if (data.urgencies.includes("high")) urgency = "high";
      else if (data.urgencies.includes("med")) urgency = "med";
      // Upcoming high-impact macro event bumps urgency
      if (macro?.upcomingHighImpact && urgency === "low") urgency = "med";

      // Reason
      const topHeadline = data.headlines.sort(
        (a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment)
      )[0];

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
        sources: Array.from(sourcesSet),
        sourceDetails: sourceContributions,
        explainability: explainSteps,
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

    signals.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json({
      signals,
      generatedAt: new Date().toISOString(),
      articleCount: analyses.length,
      sourcesUsed: {
        news: analyses.length,
        social: socialData.length,
        macro: macroData.length,
        quotes: quotes.length,
      },
    });
  } catch (error) {
    console.error("Signal generation error:", error);
    return NextResponse.json(
      { signals: [], error: "Failed to generate signals" },
      { status: 500 }
    );
  }
}
