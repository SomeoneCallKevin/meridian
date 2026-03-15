"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  analyzedAt: number;
};

const CACHE_KEY = "meridian-nlp-cache";
const CACHE_MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours

function getCache(): Record<string, CachedAnalysis> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Remove expired entries
    const now = Date.now();
    const valid: Record<string, CachedAnalysis> = {};
    for (const [key, val] of Object.entries(data)) {
      const entry = val as CachedAnalysis;
      if (now - entry.analyzedAt < CACHE_MAX_AGE) {
        valid[key] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, CachedAnalysis>) {
  try {
    const json = JSON.stringify(cache);
    localStorage.setItem(CACHE_KEY, json);
    console.log("[Meridian] Saved", Object.keys(cache).length, "analyses to cache");
  } catch (e) {
    console.error("[Meridian] Cache save failed:", e);
  }
}

function makeKey(headline: string): string {
  return headline.trim().slice(0, 120);
}

function enrichArticle(article: NewsArticle, cached: CachedAnalysis): NewsArticle {
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
  const cacheRef = useRef<Record<string, CachedAnalysis>>({});

  // Load cache on mount
  useEffect(() => {
    cacheRef.current = getCache();
    if (Object.keys(cacheRef.current).length > 0) {
      console.log("[Meridian] Loaded", Object.keys(cacheRef.current).length, "cached analyses");
    }
  }, []);

  // Fetch raw articles and apply cached analyses
  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        const cache = cacheRef.current;
        let hasEnriched = false;

        const processed = data.articles.map((article: NewsArticle) => {
          const key = makeKey(article.headline);
          const cached = cache[key];
          if (cached) {
            hasEnriched = true;
            return enrichArticle(article, cached);
          }
          return article;
        });

        setArticles(processed);
        setIsLive(true);
        if (hasEnriched) setNlpEnabled(true);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyze articles with Claude
  const analyzeArticles = useCallback(async () => {
    const currentArticles = articles.filter((a) => !a.nlpAnalyzed);
    if (currentArticles.length === 0) return;

    setAnalyzing(true);

    try {
      const batch = currentArticles.slice(0, 10).map((a) => ({
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
        console.error("[Meridian] Analysis failed:", res.status);
        return;
      }

      const data = await res.json();

      if (data.analyses && data.analyses.length > 0) {
        // Build a map of analysis results by article ID
        const analysisMap = new Map<string, (typeof data.analyses)[0]>();
        for (const a of data.analyses) {
          analysisMap.set(a.id, a);
        }

        // Update the cache ref
        const cache = { ...cacheRef.current };

        // Find matching articles and build cache entries
        for (const article of currentArticles) {
          const analysis = analysisMap.get(article.id);
          if (analysis) {
            const key = makeKey(article.headline);
            cache[key] = {
              sentiment: analysis.sentiment,
              category: analysis.category,
              urgency: analysis.urgency,
              affectedAssets: analysis.affectedAssets.map((a: AssetImpact) => a.ticker),
              assetImpacts: analysis.affectedAssets,
              causalChain: analysis.causalChain,
              confidence: analysis.confidence,
              nlpSummary: analysis.summary,
              analyzedAt: Date.now(),
            };
          }
        }

        // Save to localStorage
        cacheRef.current = cache;
        setCache(cache);

        // Update articles state
        setArticles((prev) =>
          prev.map((article) => {
            const key = makeKey(article.headline);
            const cached = cache[key];
            if (cached) {
              return enrichArticle(article, cached);
            }
            return article;
          })
        );

        setNlpEnabled(true);
      }
    } catch (error) {
      console.error("[Meridian] Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [articles]);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
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
    console.log("[Meridian] Cache cleared");
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