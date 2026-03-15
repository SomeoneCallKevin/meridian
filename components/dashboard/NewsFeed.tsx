"use client";

import { useState } from "react";
import { useNews, type NewsArticle } from "@/lib/useNews";

const tabs = ["All", "Geopolitical", "Earnings", "Macro", "Regulatory"];

const catColors: Record<string, string> = {
  earnings: "bg-accent-blue/10 text-accent-blue",
  geopolitical: "bg-accent-red/10 text-accent-red",
  macro: "bg-accent-amber/10 text-accent-amber",
  regulatory: "bg-accent-amber/10 text-accent-amber",
  general: "bg-white/[0.06] text-t-muted",
};

export default function NewsFeed() {
  const { articles, isLive, loading } = useNews();
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? articles
      : articles.filter(
          (n) => n.category.toLowerCase() === activeTab.toLowerCase()
        );

  // Show max 7 in the dashboard widget
  const display = filtered.slice(0, 7);

  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B8FF0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M7 8h10M7 12h6M7 16h8" />
          </svg>
          <span className="font-semibold text-[15px]">News feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
          )}
          <span className="text-[11px] text-t-muted">{isLive ? "Live" : "Loading..."}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06] mb-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "text-t-primary font-medium border-t-primary"
                : "text-t-muted border-transparent hover:text-t-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* News items */}
      {loading ? (
        <div className="py-8 text-center text-t-muted text-sm">
          Loading news...
        </div>
      ) : display.length === 0 ? (
        <div className="py-8 text-center text-t-muted text-sm">
          No articles in this category.
        </div>
      ) : (
        <div className="flex flex-col">
          {display.map((item) => (
            <NewsRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsRow({ item }: { item: NewsArticle }) {
  const isBullish = item.sentiment > 0;
  const isNeutral = item.sentiment === 0;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors block no-underline"
    >
      <div className="text-[13px] text-t-primary leading-snug mb-2">
        {item.headline}
      </div>
      <div className="flex items-center gap-2.5 text-[11px] text-t-muted">
        {!isNeutral && (
          <>
            <span
              className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
                isBullish ? "bg-accent-green" : "bg-accent-red"
              }`}
            />
            <span className={isBullish ? "text-accent-green" : "text-accent-red"}>
              {isBullish ? "Bullish" : "Bearish"} {item.sentiment > 0 ? "+" : ""}
              {item.sentiment.toFixed(1)}
            </span>
          </>
        )}
        {isNeutral && (
          <>
            <span className="w-[7px] h-[7px] rounded-full flex-shrink-0 bg-t-muted" />
            <span className="text-t-muted">Neutral 0.0</span>
          </>
        )}
        <span>{item.source}</span>
        <span>{item.time}</span>
        {item.category !== "general" && (
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${catColors[item.category]}`}
          >
            {item.category}
          </span>
        )}
      </div>
    </a>
  );
}
