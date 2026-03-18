"use client";

import { useState } from "react";
import { useSocialSignals } from "@/lib/useSocialSignals";
import type { SocialAggregation } from "@/lib/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    reddit: "bg-orange-500/15 text-orange-400",
    stocktwits: "bg-blue-500/15 text-blue-400",
    twitter: "bg-sky-500/15 text-sky-400",
  };
  return (
    <span
      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
        colors[platform] || "bg-white/[0.04] text-t-muted"
      }`}
    >
      {platform}
    </span>
  );
}

function ExpandedTicker({ agg }: { agg: SocialAggregation }) {
  return (
    <div className="px-5 pb-5 space-y-3">
      {/* Top posts */}
      {agg.topPosts.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Top posts
          </div>
          {agg.topPosts.slice(0, 4).map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <PlatformBadge platform={post.platform} />
                <span className="text-xs text-t-muted">{post.author}</span>
                <span className="text-xs text-t-muted ml-auto">
                  {timeAgo(post.timestamp)}
                </span>
              </div>
              <p className="text-sm text-t-secondary leading-relaxed">
                {post.content}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-t-muted">
                <span>{post.engagement.likes.toLocaleString()} likes</span>
                <span>{post.engagement.comments} comments</span>
                <span
                  className={`ml-auto font-mono ${
                    post.sentiment > 0.1
                      ? "text-accent-green"
                      : post.sentiment < -0.1
                      ? "text-accent-red"
                      : "text-t-muted"
                  }`}
                >
                  {post.sentiment > 0 ? "+" : ""}
                  {post.sentiment.toFixed(2)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SocialSignalsPage() {
  const { aggregations, loading, trending, mostBullish, mostBearish, refresh } =
    useSocialSignals();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Social Signals</h2>
          <p className="text-sm text-t-secondary mt-1">
            Live sentiment from Reddit &amp; StockTwits
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] text-t-secondary hover:bg-white/[0.04] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Tickers Found
          </div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {aggregations.length}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Total Mentions
          </div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {aggregations
              .reduce((s, a) => s + a.mentions, 0)
              .toLocaleString()}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Most Bullish
          </div>
          <div className="text-2xl font-mono font-semibold mt-1 text-accent-green">
            {mostBullish[0]?.ticker || "—"}
          </div>
          <div className="text-xs text-t-muted mt-0.5">
            {mostBullish[0]
              ? `${mostBullish[0].avgSentiment.toFixed(2)} sentiment`
              : ""}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">
            Most Bearish
          </div>
          <div className="text-2xl font-mono font-semibold mt-1 text-accent-red">
            {mostBearish[0]?.ticker || "—"}
          </div>
          <div className="text-xs text-t-muted mt-0.5">
            {mostBearish[0]
              ? `${mostBearish[0].avgSentiment.toFixed(2)} sentiment`
              : ""}
          </div>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            Trending by volume change
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {trending.slice(0, 5).map((agg) => (
              <div
                key={agg.ticker}
                className="bg-card border border-white/[0.06] rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-t-primary">
                    {agg.ticker}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      agg.volumeChange > 0
                        ? "text-accent-green"
                        : "text-accent-red"
                    }`}
                  >
                    {agg.volumeChange > 0 ? "+" : ""}
                    {agg.volumeChange.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-t-muted">
                  {agg.mentions.toLocaleString()} mentions
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        agg.avgSentiment > 0
                          ? "bg-accent-green"
                          : "bg-accent-red"
                      }`}
                      style={{
                        width: `${Math.abs(agg.avgSentiment) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-t-muted">
                    {agg.avgSentiment.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-1 mt-2">
                  {agg.platforms.map((p) => (
                    <PlatformBadge key={p} platform={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full table */}
      {loading ? (
        <div className="bg-card border border-white/[0.06] rounded-xl p-12 text-center text-t-muted">
          <div className="animate-pulse">Fetching social data from Reddit &amp; StockTwits...</div>
        </div>
      ) : aggregations.length === 0 ? (
        <div className="bg-card border border-white/[0.06] rounded-xl p-12 text-center text-t-muted">
          No ticker mentions found. Try refreshing.
        </div>
      ) : (
        <div className="bg-card border border-white/[0.06] rounded-xl">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold">All tickers</h3>
            <span className="text-xs text-t-muted">
              Click a row to see posts
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {aggregations.map((agg) => (
              <div key={agg.ticker}>
                <button
                  onClick={() =>
                    setExpanded(
                      expanded === agg.ticker ? null : agg.ticker
                    )
                  }
                  className="w-full px-5 py-4 flex items-center gap-6 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="w-16 font-mono font-semibold">
                    {agg.ticker}
                  </div>
                  <div className="w-28 text-sm text-t-secondary font-mono">
                    {agg.mentions.toLocaleString()} mentions
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            agg.avgSentiment > 0
                              ? "bg-accent-green"
                              : "bg-accent-red"
                          }`}
                          style={{
                            width: `${50 + agg.avgSentiment * 50}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-xs font-mono ${
                          agg.avgSentiment > 0.1
                            ? "text-accent-green"
                            : agg.avgSentiment < -0.1
                            ? "text-accent-red"
                            : "text-t-muted"
                        }`}
                      >
                        {agg.avgSentiment > 0 ? "+" : ""}
                        {agg.avgSentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-20 text-right text-sm font-mono ${
                      agg.volumeChange > 0
                        ? "text-accent-green"
                        : "text-accent-red"
                    }`}
                  >
                    {agg.volumeChange > 0 ? "+" : ""}
                    {agg.volumeChange.toFixed(0)}% vol
                  </div>
                  <div className="flex gap-1">
                    {agg.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                  </div>
                  <svg
                    className={`w-4 h-4 text-t-muted transition-transform ${
                      expanded === agg.ticker ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expanded === agg.ticker && <ExpandedTicker agg={agg} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
