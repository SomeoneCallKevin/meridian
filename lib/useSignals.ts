"use client";

import { useState, useCallback } from "react";
import { useNews } from "@/lib/useNews";
import { useQuotes } from "@/lib/useQuotes";

export type LiveSignal = {
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

const SIGNALS_CACHE_KEY = "meridian-signals-cache";
const CACHE_MAX_AGE = 4 * 60 * 60 * 1000;

function loadSignalsCache(): { signals: LiveSignal[]; cachedAt: number } | null {
  try {
    const raw = localStorage.getItem(SIGNALS_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.cachedAt > CACHE_MAX_AGE) return null;
    return data;
  } catch {
    return null;
  }
}

function saveSignalsCache(signals: LiveSignal[]) {
  try {
    localStorage.setItem(
      SIGNALS_CACHE_KEY,
      JSON.stringify({ signals, cachedAt: Date.now() })
    );
  } catch {}
}

export function useSignals() {
  const { articles, isLive: newsLive, nlpEnabled, analyzeArticles, analyzing: newsAnalyzing } = useNews();
  const { quotes, isLive: quotesLive } = useQuotes();

  const cached = typeof window !== "undefined" ? loadSignalsCache() : null;
  const [signals, setSignals] = useState<LiveSignal[]>(cached?.signals || []);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(cached !== null);

  const generateSignals = useCallback(async () => {
    // If articles aren't analyzed yet, analyze them first
    const analyzedArticles = articles.filter((a) => a.nlpAnalyzed);

    if (analyzedArticles.length === 0) {
      // Need to analyze first
      await analyzeArticles();
      return;
    }

    setGenerating(true);

    try {
      // Prepare analyzed news data
      const analyses = analyzedArticles.map((a) => ({
        headline: a.headline,
        sentiment: a.sentiment,
        urgency: a.urgency || "low",
        category: a.category,
        confidence: a.confidence || 0.5,
        nlpSummary: a.nlpSummary || "",
        assetImpacts: a.assetImpacts || [],
        causalChain: a.causalChain || [],
        source: a.source,
        time: a.time,
      }));

      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyses, quotes }),
      });

      if (!res.ok) {
        console.error("[Meridian] Signal generation failed:", res.status);
        return;
      }

      const data = await res.json();

      if (data.signals && data.signals.length > 0) {
        setSignals(data.signals);
        setGenerated(true);
        saveSignalsCache(data.signals);
        console.log("[Meridian] Generated", data.signals.length, "signals");
      }
    } catch (error) {
      console.error("[Meridian] Signal generation error:", error);
    } finally {
      setGenerating(false);
    }
  }, [articles, quotes, analyzeArticles]);

  const clearSignals = useCallback(() => {
    setSignals([]);
    setGenerated(false);
    try {
      localStorage.removeItem(SIGNALS_CACHE_KEY);
    } catch {}
  }, []);

  return {
    signals,
    generating,
    generated,
    generateSignals,
    clearSignals,
    newsLive,
    quotesLive,
    nlpEnabled,
    newsAnalyzing,
    analyzeArticles,
    articleCount: articles.length,
    analyzedCount: articles.filter((a) => a.nlpAnalyzed).length,
  };
}
