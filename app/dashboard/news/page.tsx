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

export default function NewsPage() {
  const { articles, isLive, loading } = useNews();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  let filtered = [...articles];

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
        n.source.toLowerCase().includes(q) ||
        n.affectedAssets.some((a) => a.toLowerCase().includes(q))
    );
  }

  const bullishCount = articles.filter((n) => n.sentiment > 0).length;
  const bearishCount = articles.filter((n) => n.sentiment < 0).length;
  const neutralCount = articles.filter((n) => n.sentiment === 0).length;
  const avgSentiment =
    articles.length > 0
      ? articles.reduce((acc, n) => acc + n.sentiment, 0) / articles.length
      : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">News feed</h2>
          <p className="text-sm text-t-muted mt-1">
            Real-time news scored by the NLP sentiment engine
          </p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/15">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
            <span className="text-xs text-accent-green font-medium">Live feed</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            Articles
          </div>
          <div className="text-[24px] font-semibold font-mono">
            {loading ? "..." : articles.length}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            Bullish
          </div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">
            {loading ? "..." : bullishCount}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            Bearish
          </div>
          <div className="text-[24px] font-semibold font-mono text-accent-red">
            {loading ? "..." : bearishCount}
          </div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            Avg sentiment
          </div>
          <div
            className={`text-[24px] font-semibold font-mono ${
              avgSentiment >= 0 ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {loading ? "..." : `${avgSentiment > 0 ? "+" : ""}${avgSentiment.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search headlines, sources, or tickers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-[13px] text-t-primary placeholder:text-t-muted outline-none focus:border-accent-green/30 transition-colors"
            />
          </div>
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
        {loading ? (
          <div className="py-12 text-center text-t-muted text-sm">
            Loading live news...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-t-muted text-sm">
            No articles match your search.
          </div>
        ) : (
          filtered.map((item) => <NewsCard key={item.id} item={item} />)
        )}
      </div>

      {/* Sentiment note */}
      <div className="text-[12px] text-t-muted text-center">
        Sentiment scores are generated by keyword analysis. Full NLP scoring via Claude API coming soon.
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsArticle }) {
  const isBullish = item.sentiment > 0;
  const isNeutral = item.sentiment === 0;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="py-4 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors block no-underline"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-[14px] text-t-primary leading-snug font-medium">
            {item.headline}
          </div>
          {item.summary && (
            <div className="text-[12px] text-t-muted mt-1.5 leading-relaxed line-clamp-2">
              {item.summary}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2.5 text-[12px] text-t-muted">
            {!isNeutral && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isBullish ? "bg-accent-green" : "bg-accent-red"
                  }`}
                />
                <span
                  className={`font-medium ${
                    isBullish ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {isBullish ? "Bullish" : "Bearish"}{" "}
                  {item.sentiment > 0 ? "+" : ""}
                  {item.sentiment.toFixed(1)}
                </span>
              </div>
            )}
            {isNeutral && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-t-muted" />
                <span className="text-t-muted">Neutral</span>
              </div>
            )}
            <span className="text-t-muted">|</span>
            <span>{item.source}</span>
            <span className="text-t-muted">|</span>
            <span>{item.time}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {item.category !== "general" && (
            <span
              className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize ${catColors[item.category]}`}
            >
              {item.category}
            </span>
          )}
          <div className="w-[80px] h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                isNeutral
                  ? "bg-t-muted"
                  : isBullish
                  ? "bg-accent-green"
                  : "bg-accent-red"
              }`}
              style={{ width: `${Math.max(Math.abs(item.sentiment) * 100, 5)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Affected assets */}
      {item.affectedAssets.length > 0 && (
        <div className="flex gap-1.5 mt-3">
          {item.affectedAssets.map((asset) => (
            <span
              key={asset}
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-t-secondary"
            >
              {asset}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
