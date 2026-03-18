import { NextResponse } from "next/server";

export type SearchResult = {
  symbol: string;
  description: string;
  type: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [], error: "API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();

    // Filter to common stock types and limit results
    const results: SearchResult[] = (data.result || [])
      .filter(
        (r: { type: string; symbol: string }) =>
          // Only show common stocks and ETFs, exclude warrants/options
          (r.type === "Common Stock" || r.type === "ETP" || r.type === "ADR") &&
          // Only US-listed (no dots in symbol = no foreign exchanges)
          !r.symbol.includes(".")
      )
      .slice(0, 8)
      .map((r: { symbol: string; description: string; type: string }) => ({
        symbol: r.symbol,
        description: r.description,
        type: r.type,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
