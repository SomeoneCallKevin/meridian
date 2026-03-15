"use client";

import { useState } from "react";
import { mockNews, type NewsItem } from "@/lib/mockData";

const tabs = ["All", "Geopolitical", "Earnings", "Macro", "Regulatory"];

const catColors: Record<string, string> = {
  earnings: "bg-accent-blue/10 text-accent-blue",
  geopolitical: "bg-accent-red/10 text-accent-red",
  macro: "bg-accent-amber/10 text-accent-amber",
  regulatory: "bg-accent-amber/10 text-accent-amber",
};

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  let filtered = [...mockNews];

  if (activeTab !== "All") {
    filtered = filtered.filter(
      (n) => n.category.toLowerCase() === activeTab.toLowerCase()
    );
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.headline.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q)
    );
  }

  const bullishCount = mockNews.filter((n) => n.sentiment > 0).length;
  const bearishCount = mockNews.filter((n) => n.sentiment < 0).length;
  const avgSentiment = mockNews.reduce((acc, n) => acc + n.sentiment, 0) / mockNews.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">News feed</h2>
        <p className="text-sm text-t-muted mt-1">
          Real-time news scored by the NLP sentiment engine
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Articles today</div>
          <div className="text-[24px] font-semibold font-mono">{mockNews.length}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Bullish</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">{bullishCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Bearish</div>
          <div className="text-[24px] font-semibold font-mono text-accent-red">{bearishCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg sentiment</div>
          <div className={`text-[24px] font-semibold font-mono ${avgSentiment >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {avgSentiment > 0 ? "+" : ""}{avgSentiment.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search headlines or sources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-t-primary placeholder:text-t-muted outline-none focus:border-accent-green/30 transition-colors"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-0 border-b border-white/[0.06]">
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
        </div>
      </div>

      {/* News list */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-t-muted text-sm">
            No articles match your search.
          </div>
        ) : (
          filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const isBullish = item.sentiment > 0;

  return (
    <div className="py-4 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-[14px] text-t-primary leading-snug font-medium">
            {item.headline}
          </div>
          <div className="flex items-center gap-3 mt-2.5 text-[12px] text-t-muted">
            {/* Sentiment dot + score */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isBullish ? "bg-accent-green" : "bg-accent-red"}`} />
              <span className={`font-medium ${isBullish ? "text-accent-green" : "text-accent-red"}`}>
                {isBullish ? "Bullish" : "Bearish"} {item.sentiment > 0 ? "+" : ""}{item.sentiment}
              </span>
            </div>
            <span className="text-t-muted">|</span>
            <span>{item.source}</span>
            <span className="text-t-muted">|</span>
            <span>{item.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize ${catColors[item.category]}`}>
            {item.category}
          </span>
          {/* Sentiment bar */}
          <div className="w-[80px] h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isBullish ? "bg-accent-green" : "bg-accent-red"}`}
              style={{ width: `${Math.abs(item.sentiment) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Affected assets - mock */}
      <div className="flex gap-1.5 mt-3">
        {getAffectedAssets(item).map((asset) => (
          <span key={asset} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-t-secondary">
            {asset}
          </span>
        ))}
      </div>
    </div>
  );
}

function getAffectedAssets(item: NewsItem): string[] {
  const assetMap: Record<string, string[]> = {
    "n-1": ["NVDA", "GOOGL", "META", "MSFT"],
    "n-2": ["NVDA", "AMD", "SMCI"],
    "n-3": ["CL", "XOM", "CVX"],
    "n-4": ["BTC", "ETH", "QQQ", "SPY"],
    "n-5": ["BTC", "ETH", "COIN"],
    "n-6": ["AMZN", "NVDA", "AMD"],
    "n-7": ["CL", "XOM", "CVX", "BP"],
  };
  return assetMap[item.id] || [];
}
