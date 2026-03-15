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

export function useNews(refreshInterval = 120000) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [nlpEnabled, setNlpEnabled] = useState(false);

  // Fetch raw articles from Finnhub
  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        setArticles((prev) => {
          // Preserve NLP data for articles we already analyzed
          const analyzed = new Map(
            prev.filter((a) => a.nlpAnalyzed).map((a) => [a.id, a])
          );
          return data.articles.map((article: NewsArticle) => {
            const existing = analyzed.get(article.id);
            if (existing) {
              return { ...article, ...existing, headline: article.headline };
            }
            return article;
          });
        });
        setIsLive(true);
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
        setArticles((prev) =>
          prev.map((article) => {
            const analysis = data.analyses.find(
              (a: { id: string }) => a.id === article.id
            );
            if (analysis) {
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
        setNlpEnabled(true);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setAnalyzing(false);
    }
  }, [articles]);

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
  };
}
