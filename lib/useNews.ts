"use client";

import { useState, useEffect, useCallback } from "react";

export type AssetImpact = {
  ticker: string;
  direction: string;
  impact: number;
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
  // NLP-enriched fields (only present after Claude analysis)
  nlpAnalyzed?: boolean;
  urgency?: "high" | "med" | "low";
  assetImpacts?: AssetImpact[];
  causalChain?: string[];
  confidence?: number;
  nlpSummary?: string;
};

type CachedAnalysis = {
  sentiment: number;
  category: string;
  urgency: "high" | "med" | "low";
  affectedAssets: string[];
  assetImpacts: AssetImpact[];
  causalChain: string[];
  confidence: number;
  nlpSummary: string;
  analyzedAt: string;
};

const CACHE_KEY = "meridian-nlp-cache";
const CACHE_MAX_AGE = 1000 * 60 * 60 * 4; // 4 hours

// Load cached analyses from localStorage
function loadCache(): Record<string, CachedAnalysis> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);

    // Clean out expired entries
    const now = Date.now();
    const cleaned: Record<string, CachedAnalysis> = {};
    for (const [key, value] of Object.entries(data)) {
      const entry = value as CachedAnalysis;
      if (entry.analyzedAt) {
        const age = now - new Date(entry.analyzedAt).getTime();
        if (age < CACHE_MAX_AGE) {
          cleaned[key] = entry;
        }
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

// Save analyses to localStorage
function saveCache(cache: Record<string, CachedAnalysis>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// Apply cached analysis data to an article
function applyCacheToArticle(
  article: NewsArticle,
  cached: CachedAnalysis
): NewsArticle {
  return {
    ...article,
    nlpAnalyzed: true,
    sentiment: cached.sentiment,
    category: cached.category as NewsArticle["category"],
    urgency: cached.urgency,
    affectedAssets: cached.affectedAssets,
    assetImpacts: cached.assetImpacts,
    causalChain: cached.causalChain,
    confidence: cached.confidence,
    nlpSummary: cached.nlpSummary,
  };
}

export function useNews(refreshInterval = 120000) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [nlpEnabled, setNlpEnabled] = useState(false);

  // Fetch raw articles from Finnhub and apply any cached analyses
  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        const cache = loadCache();
        const hasCache = Object.keys(cache).length > 0;

        const enriched = data.articles.map((article: NewsArticle) => {
          // Check if we have a cached analysis for this headline
          const cacheKey = article.headline.slice(0, 100);
          const cached = cache[cacheKey];
          if (cached) {
            return applyCacheToArticle(article, cached);
          }
          return article;
        });

        setArticles(enriched);
        setIsLive(true);

        if (hasCache && enriched.some((a: NewsArticle) => a.nlpAnalyzed)) {
          setNlpEnabled(true);
        }
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  // Enrich articles with Claude NLP analysis
  const analyzeArticles = useCallback(async () => {
    const unanalyzed = articles.filter((a) => !a.nlpAnalyzed);
    if (unanalyzed.length === 0) return;

    setAnalyzing(true);

    try {
      const batch = unanalyzed.slice(0, 10).map((a) => ({
        id: a.id,
        headline: a.headline,
        summary: a.summary,
        source: a.source,
      }));

      const res = await fetch("/api/analyze/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: batch }),
      });

      if (!res.ok) {
        console.error("Analysis failed:", res.status);
        return;
      }

      const data = await res.json();

      if (data.analyses) {
        // Load existing cache and add new results
        const cache = loadCache();

        setArticles((prev) =>
          prev.map((article) => {
            const analysis = data.analyses.find(
              (a: { id: string }) => a.id === article.id
            );
            if (analysis) {
              // Save to cache using headline as key
              const cacheKey = article.headline.slice(0, 100);
              cache[cacheKey] = {
                sentiment: analysis.sentiment,
                category: analysis.category,
                urgency: analysis.urgency,
                affectedAssets: analysis.affectedAssets.map(
                  (a: AssetImpact) => a.ticker
                ),
                assetImpacts: analysis.affectedAssets,
                causalChain: analysis.causalChain,
                confidence: analysis.confidence,
                nlpSummary: analysis.summary,
                analyzedAt: new Date().toISOString(),
              };

              return {
                ...article,
                nlpAnalyzed: true,
                sentiment: analysis.sentiment,
                category: analysis.category,
                urgency: analysis.urgency,
                affectedAssets: analysis.affectedAssets.map(
                  (a: AssetImpact) => a.ticker
                ),
                assetImpacts: analysis.affectedAssets,
                causalChain: analysis.causalChain,
                confidence: analysis.confidence,
                nlpSummary: analysis.summary,
              };
            }
            return article;
          })
        );

        // Save all analyses to localStorage
        saveCache(cache);
        setNlpEnabled(true);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [articles]);

  // Clear cached analyses
  const clearCache = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CACHE_KEY);
    }
    setArticles((prev) =>
      prev.map((a) => ({
        ...a,
        nlpAnalyzed: false,
        urgency: undefined,
        assetImpacts: undefined,
        causalChain: undefined,
        confidence: undefined,
        nlpSummary: undefined,
      }))
    );
    setNlpEnabled(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchArticles, refreshInterval]);

  return {
    articles,
    isLive,
    loading,
    analyzing,
    nlpEnabled,
    analyzeArticles,
    clearCache,
  };
}
