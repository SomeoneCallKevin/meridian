import { NextResponse } from "next/server";
import type { SocialAggregation, SocialPost, SocialPlatform } from "@/lib/types";

// ─── Reddit: fetch real posts from finance subreddits ──────────
const SUBREDDITS = [
  "wallstreetbets",
  "stocks",
  "investing",
  "options",
  "stockmarket",
  "cryptocurrency",
];

// Common tickers we track – used to match mentions in posts
const TRACKED_TICKERS = [
  "NVDA", "TSLA", "AAPL", "AMZN", "MSFT", "META", "AMD", "GOOG",
  "BTC", "ETH", "XOM", "GLD", "SPY", "QQQ", "PLTR", "SOFI",
  "GME", "AMC", "RIVN", "COIN", "INTC", "BA", "DIS", "NFLX",
  "CRM", "SHOP", "SQ", "PYPL", "UBER", "ABNB",
];

// Simple keyword sentiment scoring
const BULLISH_WORDS = [
  "buy", "calls", "moon", "bullish", "long", "undervalued", "breakout",
  "rocket", "squeeze", "load", "dip", "cheap", "upside", "strong",
  "beat", "crush", "earnings", "growth", "upgrade", "accumulate",
];
const BEARISH_WORDS = [
  "sell", "puts", "bearish", "short", "overvalued", "dump", "crash",
  "tank", "bag", "expensive", "downside", "weak", "miss", "decline",
  "downgrade", "bubble", "overbought", "resistance", "drop", "cut",
];

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  let matches = 0;
  for (const w of BULLISH_WORDS) {
    if (lower.includes(w)) { score += 1; matches++; }
  }
  for (const w of BEARISH_WORDS) {
    if (lower.includes(w)) { score -= 1; matches++; }
  }
  if (matches === 0) return 0;
  return Math.max(-1, Math.min(1, score / matches));
}

function extractTickers(text: string): string[] {
  // Match $TICKER or standalone uppercase 2-5 letter words that are in our list
  const dollarMatches = text.match(/\$([A-Z]{1,5})\b/g) || [];
  const found = new Set<string>();

  for (const m of dollarMatches) {
    const t = m.replace("$", "");
    if (TRACKED_TICKERS.includes(t)) found.add(t);
  }

  // Also check for direct ticker mentions
  for (const ticker of TRACKED_TICKERS) {
    // Match whole word only (avoid matching "A" or "I")
    if (ticker.length >= 2) {
      const regex = new RegExp(`\\b${ticker}\\b`);
      if (regex.test(text)) found.add(ticker);
    }
  }

  return Array.from(found);
}

interface RedditPost {
  title: string;
  selftext?: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  subreddit: string;
}

async function fetchRedditPosts(): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  // Fetch from multiple subreddits in parallel
  const fetches = SUBREDDITS.map(async (sub) => {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=25`,
        {
          headers: {
            "User-Agent": "Meridian/1.0 (trading dashboard)",
          },
          next: { revalidate: 300 }, // cache 5 min
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      const children = data?.data?.children || [];
      return children.map((c: { data: RedditPost }) => c.data);
    } catch {
      return [];
    }
  });

  const results = await Promise.all(fetches);
  const allRedditPosts: RedditPost[] = results.flat();

  for (const rp of allRedditPosts) {
    const fullText = `${rp.title} ${rp.selftext || ""}`;
    const tickers = extractTickers(fullText);
    if (tickers.length === 0) continue;

    posts.push({
      id: `reddit-${rp.permalink.slice(0, 40)}`,
      platform: "reddit",
      author: `u/${rp.author}`,
      content: rp.title.slice(0, 300),
      timestamp: rp.created_utc * 1000,
      url: `https://reddit.com${rp.permalink}`,
      engagement: {
        likes: rp.score,
        comments: rp.num_comments,
        shares: 0,
      },
      tickers,
      sentiment: scoreSentiment(fullText),
    });
  }

  return posts;
}

// ─── StockTwits: fetch trending streams ────────────────────────

interface StockTwitsMessage {
  id: number;
  body: string;
  created_at: string;
  user: { username: string };
  entities?: {
    sentiment?: { basic: string };
  };
  likes?: { total: number };
  conversation?: { replies: number };
}

async function fetchStockTwitsPosts(tickers: string[]): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  // StockTwits has rate limits, so fetch top tickers only
  const topTickers = tickers.slice(0, 10);

  const fetches = topTickers.map(async (ticker) => {
    try {
      const res = await fetch(
        `https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.messages || []).map((m: StockTwitsMessage) => ({
        id: `st-${m.id}`,
        platform: "stocktwits" as SocialPlatform,
        author: m.user.username,
        content: m.body.slice(0, 300),
        timestamp: new Date(m.created_at).getTime(),
        url: `https://stocktwits.com/symbol/${ticker}`,
        engagement: {
          likes: m.likes?.total || 0,
          comments: m.conversation?.replies || 0,
          shares: 0,
        },
        tickers: [ticker],
        sentiment:
          m.entities?.sentiment?.basic === "Bullish"
            ? 0.7
            : m.entities?.sentiment?.basic === "Bearish"
            ? -0.7
            : scoreSentiment(m.body),
      }));
    } catch {
      return [];
    }
  });

  const results = await Promise.all(fetches);
  posts.push(...results.flat());
  return posts;
}

// ─── Aggregate all posts into per-ticker summaries ─────────────

function aggregate(posts: SocialPost[]): SocialAggregation[] {
  const byTicker = new Map<string, SocialPost[]>();

  for (const p of posts) {
    for (const t of p.tickers) {
      if (!byTicker.has(t)) byTicker.set(t, []);
      byTicker.get(t)!.push(p);
    }
  }

  const now = Date.now();
  const aggs: SocialAggregation[] = [];

  for (const [ticker, tickerPosts] of byTicker.entries()) {
    // Sort by engagement
    tickerPosts.sort(
      (a, b) =>
        b.engagement.likes + b.engagement.comments -
        (a.engagement.likes + a.engagement.comments)
    );

    const mentions = tickerPosts.length;
    const avgSentiment =
      Math.round(
        (tickerPosts.reduce((s, p) => s + p.sentiment, 0) / mentions) * 100
      ) / 100;

    // Calculate volume change: posts in last 4h vs previous 4h
    const fourHoursAgo = now - 4 * 3600 * 1000;
    const eightHoursAgo = now - 8 * 3600 * 1000;
    const recent = tickerPosts.filter((p) => p.timestamp > fourHoursAgo).length;
    const previous = tickerPosts.filter(
      (p) => p.timestamp > eightHoursAgo && p.timestamp <= fourHoursAgo
    ).length;
    const volumeChange =
      previous > 0
        ? Math.round(((recent - previous) / previous) * 100)
        : recent > 0
        ? 100
        : 0;

    const platforms = [
      ...new Set(tickerPosts.map((p) => p.platform)),
    ] as SocialPlatform[];

    aggs.push({
      ticker,
      mentions,
      avgSentiment,
      volumeChange,
      topPosts: tickerPosts.slice(0, 5),
      platforms,
      updatedAt: new Date().toISOString(),
    });
  }

  // Sort by mentions descending
  aggs.sort((a, b) => b.mentions - a.mentions);
  return aggs;
}

// ─── Route handler ─────────────────────────────────────────────

export async function GET() {
  try {
    // Fetch from both sources in parallel
    const [redditPosts, stockTwitsPosts] = await Promise.all([
      fetchRedditPosts(),
      fetchStockTwitsPosts(TRACKED_TICKERS.slice(0, 10)),
    ]);

    const allPosts = [...redditPosts, ...stockTwitsPosts];
    const aggregations = aggregate(allPosts);

    return NextResponse.json({
      aggregations,
      totalPosts: allPosts.length,
      sources: {
        reddit: redditPosts.length,
        stocktwits: stockTwitsPosts.length,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Social API error:", e);
    return NextResponse.json(
      { aggregations: [], error: "Failed to fetch social signals" },
      { status: 500 }
    );
  }
}
