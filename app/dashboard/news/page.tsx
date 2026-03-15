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
  const { articles, isLive, loading, analyzing, nlpEnabled, analyzeArticles, clearCache } =
    useNews();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

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
  const analyzedCount = articles.filter((n) => n.nlpAnalyzed).length;
  const unanalyzedCount = articles.filter((n) => !n.nlpAnalyzed).length;
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
            {nlpEnabled
              ? "Scored by Claude AI — click any article to see the full analysis"
              : "Real-time news with keyword sentiment scoring"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {nlpEnabled && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue">
              AI scored ({analyzedCount}/{articles.length})
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/15">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse-dot" />
              <span className="text-xs text-accent-green font-medium">Live feed</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Articles</div>
          <div className="text-[24px] font-semibold font-mono">{loading ? "..." : articles.length}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Bullish</div>
          <div className="text-[24px] font-semibold font-mono text-accent-green">{loading ? "..." : bullishCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Bearish</div>
          <div className="text-[24px] font-semibold font-mono text-accent-red">{loading ? "..." : bearishCount}</div>
        </div>
        <div className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">Avg sentiment</div>
          <div className={`text-[24px] font-semibold font-mono ${avgSentiment >= 0 ? "text-accent-green" : "text-accent-red"}`}>
            {loading ? "..." : `${avgSentiment > 0 ? "+" : ""}${avgSentiment.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* NLP analyze button */}
      {articles.length > 0 && (
        <div className="flex gap-3">
          {unanalyzedCount > 0 && (
            <button
              onClick={analyzeArticles}
              disabled={analyzing}
              className={`flex-1 py-3.5 text-[13px] font-medium rounded-xl border transition-all ${
                analyzing
                  ? "border-accent-blue/20 bg-accent-blue/5 text-accent-blue"
                  : "border-accent-green/20 bg-accent-green/5 text-accent-green hover:bg-accent-green/10"
              }`}
            >
              {analyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Analyzing {unanalyzedCount} articles with Claude AI...
                </span>
              ) : nlpEnabled ? (
                `Analyze ${unanalyzedCount} new article${unanalyzedCount > 1 ? "s" : ""} with Claude AI`
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 110 20 10 10 0 010-20z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Analyze all articles with Claude AI — get real sentiment, urgency, and causal chains
                </span>
              )}
            </button>
          )}
          {nlpEnabled && (
            <button
              onClick={clearCache}
              className="px-4 py-3.5 text-[12px] font-medium rounded-xl border border-white/[0.08] text-t-muted hover:text-t-secondary hover:border-white/[0.15] transition-colors"
              title="Clear cached AI analyses and re-score from scratch"
            >
              Clear cache
            </button>
          )}
        </div>
      )}

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
          <div className="py-12 text-center text-t-muted text-sm">Loading live news...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-t-muted text-sm">No articles match your search.</div>
        ) : (
          filtered.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              isExpanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NewsCard({
  item,
  isExpanded,
  onToggle,
}: {
  item: NewsArticle;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isBullish = item.sentiment > 0;
  const isNeutral = item.sentiment === 0;

  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <div
        onClick={item.nlpAnalyzed ? onToggle : undefined}
        className={`py-4 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors ${
          item.nlpAnalyzed ? "cursor-pointer" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-[14px] text-t-primary leading-snug font-medium">
              {item.headline}
            </div>
            {item.nlpSummary && (
              <div className="text-[12px] text-accent-blue mt-1.5 leading-relaxed">
                {item.nlpSummary}
              </div>
            )}
            {!item.nlpSummary && item.summary && (
              <div className="text-[12px] text-t-muted mt-1.5 leading-relaxed line-clamp-2">
                {item.summary}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2.5 text-[12px] text-t-muted flex-wrap">
              {!isNeutral ? (
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isBullish ? "bg-accent-green" : "bg-accent-red"}`} />
                  <span className={`font-medium ${isBullish ? "text-accent-green" : "text-accent-red"}`}>
                    {isBullish ? "Bullish" : "Bearish"} {item.sentiment > 0 ? "+" : ""}
                    {item.sentiment.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-t-muted" />
                  <span className="text-t-muted">Neutral</span>
                </div>
              )}
              {item.urgency && (
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  item.urgency === "high" ? "bg-accent-red/10 text-accent-red" :
                  item.urgency === "med" ? "bg-accent-amber/10 text-accent-amber" :
                  "bg-accent-blue/10 text-accent-blue"
                }`}>
                  {item.urgency} urgency
                </span>
              )}
              {item.confidence !== undefined && (
                <span className="text-t-muted">{Math.round(item.confidence * 100)}% conf</span>
              )}
              <span className="text-t-muted">|</span>
              <span>{item.source}</span>
              <span className="text-t-muted">|</span>
              <span>{item.time}</span>
              {item.nlpAnalyzed && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue">AI</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {item.category !== "general" && (
              <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full capitalize ${catColors[item.category]}`}>
                {item.category}
              </span>
            )}
            <div className="w-[80px] h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isNeutral ? "bg-t-muted" : isBullish ? "bg-accent-green" : "bg-accent-red"}`}
                style={{ width: `${Math.max(Math.abs(item.sentiment) * 100, 5)}%` }}
              />
            </div>
          </div>
        </div>

        {item.affectedAssets.length > 0 && (
          <div className="flex gap-1.5 mt-3">
            {item.affectedAssets.map((asset) => (
              <span key={asset} className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/[0.04] text-t-secondary">
                {asset}
              </span>
            ))}
          </div>
        )}

        {item.nlpAnalyzed && !isExpanded && (
          <div className="text-[11px] text-t-muted mt-2 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Click to see AI analysis
          </div>
        )}
      </div>

      {/* Expanded NLP analysis */}
      {isExpanded && item.nlpAnalyzed && (
        <div className="px-2 pb-4 -mx-2">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
            {item.assetImpacts && item.assetImpacts.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">Asset impacts</div>
                <div className="flex flex-wrap gap-2">
                  {item.assetImpacts.map((asset, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-lg border ${
                        asset.direction === "bullish"
                          ? "border-accent-green/20 bg-accent-green/5"
                          : asset.direction === "bearish"
                          ? "border-accent-red/20 bg-accent-red/5"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <span className="font-mono font-medium">{asset.ticker}</span>
                      <span className={`text-[10px] font-medium ${
                        asset.direction === "bullish" ? "text-accent-green" :
                        asset.direction === "bearish" ? "text-accent-red" : "text-t-muted"
                      }`}>
                        {asset.direction}
                      </span>
                      <div className="w-8 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            asset.direction === "bullish" ? "bg-accent-green" :
                            asset.direction === "bearish" ? "bg-accent-red" : "bg-t-muted"
                          }`}
                          style={{ width: `${asset.impact * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {item.causalChain && item.causalChain.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">Causal reasoning</div>
                <div className="flex flex-col gap-1">
                  {item.causalChain.map((step, i) => (
                    <div key={i} className="flex gap-2 text-[12px]">
                      <span className="text-t-muted flex-shrink-0">{i + 1}.</span>
                      <span className="text-t-secondary leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-accent-blue hover:text-accent-blue/80 transition-colors no-underline"
            >
              Read full article
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M5 3h8v8M13 3L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
