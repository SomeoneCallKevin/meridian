import { NextResponse } from "next/server";
import type { MacroEvent, MacroEventType } from "@/lib/types";

// Known upcoming economic events — in production this would come from
// an external API (e.g., Forex Factory, Trading Economics, or Finnhub calendar).
// For now we generate realistic upcoming events relative to the current date.

function generateUpcomingEvents(): MacroEvent[] {
  const now = new Date();
  const events: MacroEvent[] = [];

  const templates: {
    title: string;
    type: MacroEventType;
    impact: MacroEvent["impact"];
    country: string;
    affectedAssets: string[];
    dayOffset: number;
    time: string | null;
  }[] = [
    {
      title: "FOMC Interest Rate Decision",
      type: "fed-rate",
      impact: "high",
      country: "US",
      affectedAssets: ["SPY", "QQQ", "TLT", "GLD", "BTC"],
      dayOffset: 3,
      time: "18:00",
    },
    {
      title: "US Consumer Price Index (CPI) MoM",
      type: "cpi",
      impact: "high",
      country: "US",
      affectedAssets: ["SPY", "TLT", "GLD", "BTC"],
      dayOffset: 5,
      time: "12:30",
    },
    {
      title: "US Non-Farm Payrolls",
      type: "jobs",
      impact: "high",
      country: "US",
      affectedAssets: ["SPY", "QQQ", "TLT"],
      dayOffset: 8,
      time: "12:30",
    },
    {
      title: "OPEC+ Monthly Meeting",
      type: "opec",
      impact: "high",
      country: "INT",
      affectedAssets: ["CL", "XOM", "CVX"],
      dayOffset: 10,
      time: "14:00",
    },
    {
      title: "US GDP Growth Rate QoQ (Advance)",
      type: "gdp",
      impact: "high",
      country: "US",
      affectedAssets: ["SPY", "QQQ", "TLT"],
      dayOffset: 14,
      time: "12:30",
    },
    {
      title: "US ISM Manufacturing PMI",
      type: "pmi",
      impact: "medium",
      country: "US",
      affectedAssets: ["SPY", "XOM"],
      dayOffset: 1,
      time: "14:00",
    },
    {
      title: "ECB Interest Rate Decision",
      type: "fed-rate",
      impact: "high",
      country: "EU",
      affectedAssets: ["EUR/USD", "DAX"],
      dayOffset: 7,
      time: "12:15",
    },
    {
      title: "China Trade Balance",
      type: "other",
      impact: "medium",
      country: "CN",
      affectedAssets: ["BABA", "FXI", "AAPL"],
      dayOffset: 6,
      time: "02:00",
    },
    {
      title: "NVDA Earnings Report",
      type: "earnings",
      impact: "high",
      country: "US",
      affectedAssets: ["NVDA", "AMD", "MSFT", "QQQ"],
      dayOffset: 12,
      time: "20:00",
    },
    {
      title: "US Initial Jobless Claims",
      type: "jobs",
      impact: "low",
      country: "US",
      affectedAssets: ["SPY", "TLT"],
      dayOffset: 2,
      time: "12:30",
    },
    {
      title: "US Core PCE Price Index MoM",
      type: "cpi",
      impact: "high",
      country: "US",
      affectedAssets: ["SPY", "TLT", "GLD"],
      dayOffset: 18,
      time: "12:30",
    },
    {
      title: "BOJ Interest Rate Decision",
      type: "fed-rate",
      impact: "medium",
      country: "JP",
      affectedAssets: ["USD/JPY", "NKY"],
      dayOffset: 15,
      time: "03:00",
    },
  ];

  for (const t of templates) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + t.dayOffset);

    events.push({
      id: `macro-${t.type}-${t.dayOffset}`,
      title: t.title,
      type: t.type,
      date: eventDate.toISOString().split("T")[0],
      time: t.time,
      country: t.country,
      impact: t.impact,
      previous: null,
      forecast: null,
      actual: null,
      description: `Scheduled ${t.title} event`,
      affectedAssets: t.affectedAssets,
    });
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function GET() {
  try {
    const events = generateUpcomingEvents();
    return NextResponse.json({
      events,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { events: [], error: "Failed to fetch macro calendar" },
      { status: 500 }
    );
  }
}
