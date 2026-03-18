"use client";

import { useState, useEffect, useCallback } from "react";
import type { MacroEvent } from "@/lib/types";
import { storeGetCached, storeSetCached } from "@/lib/store";

const CACHE_KEY = "macro-events";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useMacroCalendar() {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    // Check cache first
    const cached = storeGetCached<MacroEvent[]>(CACHE_KEY, CACHE_TTL);
    if (cached) {
      setEvents(cached.data);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/macro-calendar");
      if (!res.ok) return;
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        storeSetCached(CACHE_KEY, data.events);
      }
    } catch {
      // Keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const highImpactEvents = events.filter((e) => e.impact === "high");

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.date).toDateString();
    return eventDate === new Date().toDateString();
  });

  const getEventsForTicker = useCallback(
    (ticker: string) =>
      events.filter((e) =>
        e.affectedAssets.some((a) => a.toUpperCase() === ticker.toUpperCase())
      ),
    [events]
  );

  return {
    events,
    loading,
    upcomingEvents,
    highImpactEvents,
    todayEvents,
    getEventsForTicker,
    refresh: fetchEvents,
  };
}
