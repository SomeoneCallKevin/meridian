"use client";

import { useState, useEffect, useCallback } from "react";
import type { SocialAggregation } from "@/lib/types";
import { storeGetCached, storeSetCached } from "@/lib/store";

const CACHE_KEY = "social-signals";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useSocialSignals() {
  const [aggregations, setAggregations] = useState<SocialAggregation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSocial = useCallback(async () => {
    const cached = storeGetCached<SocialAggregation[]>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      setAggregations(cached.data);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/social");
      if (!res.ok) return;
      const data = await res.json();
      if (data.aggregations) {
        setAggregations(data.aggregations);
        storeSetCached(CACHE_KEY, data.aggregations);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSocial();
  }, [fetchSocial]);

  const getTicker = useCallback(
    (ticker: string) =>
      aggregations.find(
        (a) => a.ticker.toUpperCase() === ticker.toUpperCase()
      ),
    [aggregations]
  );

  const trending = [...aggregations]
    .sort((a, b) => b.volumeChange - a.volumeChange)
    .slice(0, 10);

  const mostBullish = [...aggregations]
    .sort((a, b) => b.avgSentiment - a.avgSentiment)
    .slice(0, 5);

  const mostBearish = [...aggregations]
    .sort((a, b) => a.avgSentiment - b.avgSentiment)
    .slice(0, 5);

  return {
    aggregations,
    loading,
    getTicker,
    trending,
    mostBullish,
    mostBearish,
    refresh: fetchSocial,
  };
}
