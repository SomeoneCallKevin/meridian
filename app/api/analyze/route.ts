import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type AnalysisResult = {
  sentiment: number;
  urgency: "high" | "med" | "low";
  category: "earnings" | "geopolitical" | "macro" | "regulatory" | "general";
  affectedAssets: { ticker: string; direction: "bullish" | "bearish" | "neutral"; impact: number }[];
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
    const { headline, summary, source } = body;

    if (!headline) {
      return NextResponse.json(
        { error: "headline is required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a financial news analyst for a trading intelligence platform. Analyze this news article and return ONLY a JSON object with no additional text.

Article headline: "${headline}"
${summary ? `Summary: "${summary}"` : ""}
Source: ${source || "Unknown"}

Return this exact JSON structure:
{
  "sentiment": <number from -1.0 (very bearish) to 1.0 (very bullish)>,
  "urgency": "<high|med|low>",
  "category": "<earnings|geopolitical|macro|regulatory|general>",
  "affectedAssets": [
    {"ticker": "<TICKER>", "direction": "<bullish|bearish|neutral>", "impact": <0.0 to 1.0>}
  ],
  "causalChain": [
    "<step 1: what happened>",
    "<step 2: immediate market effect>",
    "<step 3: which assets are affected and why>"
  ],
  "confidence": <0.0 to 1.0 how confident you are in this analysis>,
  "summary": "<one sentence trading-relevant summary>"
}

Rules:
- Be precise with sentiment scores. Don't default to 0.
- For affected assets, use real ticker symbols (NVDA, AAPL, BTC, CL, etc.)
- Include both directly and indirectly affected assets
- Urgency: "high" = needs immediate attention, "med" = important but not time-critical, "low" = background information
- Causal chain should show your reasoning from event → market impact → specific assets
- Keep the summary actionable and concise
- Return ONLY valid JSON, no markdown formatting, no backticks`,
        },
      ],
    });

    // Extract text content from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON - strip any markdown formatting if present
    const cleaned = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const analysis: AnalysisResult = JSON.parse(cleaned);

    // Validate and clamp values
    analysis.sentiment = Math.max(-1, Math.min(1, analysis.sentiment));
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence));

    return NextResponse.json({
      analysis,
      model: "claude-sonnet-4-20250514",
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);

    // Return a useful error message
    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
