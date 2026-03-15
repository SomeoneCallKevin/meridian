"use client";

import { useState } from "react";
import { mockNews, type NewsItem } from "@/lib/mockData";

const tabs = ["All", "Geopolitical", "Earnings", "Macro"];

const catColors: Record<string, string> = {
  earnings: "bg-accent-blue/10 text-accent-blue",
  geopolitical: "bg-accent-red/10 text-accent-red",
  macro: "bg-accent-amber/10 text-accent-amber",
  regulatory: "bg-accent-amber/10 text-accent-amber",
};

export default function NewsFeed() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered =
    activeTab === "All"
      ? mockNews
      : mockNews.filter(
          (n) => n.category.toLowerCase() === activeTab.toLowerCase()
        );

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
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
          <span className="text-[11px] text-t-muted">Live</span>
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
      <div className="flex flex-col">
        {filtered.map((item) => (
          <NewsRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const isBullish = item.sentiment > 0;

  return (
    <div className="py-3 border-b border-white/[0.06] last:border-b-0 cursor-pointer hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
      <div className="text-[13px] text-t-primary leading-snug mb-2">
        {item.headline}
      </div>
      <div className="flex items-center gap-2.5 text-[11px] text-t-muted">
        <span
          className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${
            isBullish ? "bg-accent-green" : "bg-accent-red"
          }`}
        />
        <span className={isBullish ? "text-accent-green" : "text-accent-red"}>
          {isBullish ? "Bullish" : "Bearish"} {item.sentiment > 0 ? "+" : ""}
          {item.sentiment}
        </span>
        <span>{item.source}</span>
        <span>{item.time}</span>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${catColors[item.category]}`}
        >
          {item.category}
        </span>
      </div>
    </div>
  );
}
