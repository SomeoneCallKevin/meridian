"use client";

import { useState, useEffect } from "react";

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

export function useNews(refreshInterval = 120000) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) return;
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
          setIsLive(true);
        }
      } catch {
        // Keep existing data
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    const interval = setInterval(fetchNews, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { articles, isLive, loading };
}
