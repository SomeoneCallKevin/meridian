import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ArticleInput = {
  id: string;
  headline: string;
  summary?: string;
  source?: string;
};

type ArticleAnalysis = {
  id: string;
  sentiment: number;
  urgency: "high" | "med" | "low";
  category: "earnings" | "geopolitical" | "macro" | "regulatory" | "general";
  affectedAssets: { ticker: string; direction: string; impact: number }[];
  causalChain: string[];
  confidence: number;
  summary: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const articles: ArticleInput[] = body.articles;

    if (!articles || articles.length === 0) {
      return NextResponse.json(
        { error: "articles array is required" },
        { status: 400 }
      );
    }

    // Limit to 10 articles per batch to control costs
    const batch = articles.slice(0, 10);

    // Format articles for the prompt
    const articleList = batch
      .map(
        (a, i) =>
          `[Article ${i + 1}] ID: ${a.id}
Headline: ${a.headline}
${a.summary ? `Summary: ${a.summary}` : ""}
Source: ${a.source || "Unknown"}`
      )
      .join("\n\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a financial news analyst for a trading intelligence platform. Analyze these ${batch.length} news articles and return a JSON array.

${articleList}

Return ONLY a JSON array with one object per article:
[
  {
    "id": "<article ID from above>",
    "sentiment": <-1.0 to 1.0>,
    "urgency": "<high|med|low>",
    "category": "<earnings|geopolitical|macro|regulatory|general>",
    "affectedAssets": [{"ticker": "<TICKER>", "direction": "<bullish|bearish|neutral>", "impact": <0.0-1.0>}],
    "causalChain": ["<event>", "<market effect>", "<asset impact>"],
    "confidence": <0.0-1.0>,
    "summary": "<one-sentence trading summary>"
  }
]

Rules:
- Analyze EVERY article. Return exactly ${batch.length} objects.
- Be precise with sentiment — don't default to 0.
- Use real ticker symbols (NVDA, AAPL, BTC, CL, XOM, ETH, etc.)
- High urgency = time-sensitive, could move markets now
- Include both direct and indirect asset impacts
- Keep summaries short and actionable
- Return ONLY valid JSON array, no markdown, no backticks`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const analyses: ArticleAnalysis[] = JSON.parse(cleaned);

    // Validate each analysis
    const validated = analyses.map((a) => ({
      ...a,
      sentiment: Math.max(-1, Math.min(1, a.sentiment)),
      confidence: Math.max(0, Math.min(1, a.confidence)),
    }));

    return NextResponse.json({
      analyses: validated,
      count: validated.length,
      model: "claude-sonnet-4-20250514",
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Batch analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Batch analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
