"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { mockSignals } from "@/lib/mockData";

const signalDetails: Record<string, {
  price: string;
  target: string;
  targetPct: string;
  stopLoss: string;
  stopPct: string;
  riskReward: string;
  positionSize: string;
  techExposure: string;
  sources: { name: string; sentiment: number; confirms: boolean }[];
  indicators: { name: string; value: string; signal: string; note: string }[];
  chain: { title: string; detail: string }[];
  news: { headline: string; source: string; sentiment: number; time: string }[];
  risks: string;
}> = {
  "sig-1": {
    price: "$878.20",
    target: "$925",
    targetPct: "5.3%",
    stopLoss: "$838",
    stopPct: "-4.6%",
    riskReward: "1 : 1.15",
    positionSize: "$965 (11 shares)",
    techExposure: "Tech: 34% (+2%)",
    sources: [
      { name: "News NLP", sentiment: 0.9, confirms: true },
      { name: "Geopolitical", sentiment: 0.3, confirms: true },
      { name: "Technical", sentiment: 0.7, confirms: true },
      { name: "Social", sentiment: 0.6, confirms: true },
    ],
    indicators: [
      { name: "RSI (14)", value: "58.3", signal: "Neutral-bullish", note: "Room to run" },
      { name: "MACD", value: "+4.2", signal: "Bullish cross", note: "2 days ago" },
      { name: "50-day MA", value: "$841", signal: "Above", note: "+4.4% above" },
      { name: "Volume", value: "1.8x", signal: "High", note: "vs 20d avg" },
    ],
    chain: [
      { title: "NVIDIA Q4 revenue up 265% driven by data center segment", detail: "Direct catalyst — earnings massively exceeded analyst expectations ($22.1B vs $20.4B consensus)" },
      { title: "AI infrastructure spending accelerating across hyperscalers", detail: "Microsoft, Google, Amazon all increased CapEx guidance for AI compute. NVDA is dominant GPU supplier (~80% market share)." },
      { title: "EU AI regulation creates short-term uncertainty but long-term demand", detail: "Geopolitical signal: new EU rules may slow deployment in Europe (-0.2), but compliance requirements drive more compute need (+0.5). Net positive." },
      { title: "Technical breakout confirms fundamental thesis", detail: "MACD bullish crossover + high volume + price above 50-day MA. Chart pattern aligns with the news catalyst." },
    ],
    news: [
      { headline: "NVIDIA smashes revenue records as AI boom accelerates", source: "Bloomberg", sentiment: 0.9, time: "1h ago" },
      { headline: "Big Tech CapEx surge signals multi-year AI infrastructure cycle", source: "Reuters", sentiment: 0.7, time: "3h ago" },
      { headline: "EU approves sweeping AI regulation framework", source: "Reuters", sentiment: -0.6, time: "12m ago" },
    ],
    risks: "Valuation is stretched at 65x forward P/E. EU regulation could slow customer deployments near-term. AMD and custom silicon (Google TPU, Amazon Trainium) are gaining share. Earnings may already be priced in after 8% run-up this week.",
  },
};

// Fallback details for signals without specific data
const defaultDetails = {
  price: "$--",
  target: "$--",
  targetPct: "--%",
  stopLoss: "$--",
  stopPct: "--%",
  riskReward: "-- : --",
  positionSize: "Calculating...",
  techExposure: "Calculating...",
  sources: [
    { name: "News NLP", sentiment: 0.5, confirms: true },
    { name: "Technical", sentiment: 0.4, confirms: true },
  ],
  indicators: [
    { name: "RSI (14)", value: "--", signal: "Pending", note: "Loading" },
    { name: "MACD", value: "--", signal: "Pending", note: "Loading" },
  ],
  chain: [
    { title: "Analysis in progress", detail: "The full causal reasoning chain is being computed by the sentiment engine." },
  ],
  news: [],
  risks: "Full risk analysis will be available once all signal sources have been processed.",
};

export default function SignalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const signal = mockSignals.find((s) => s.id === id);
  const details = signalDetails[id] || defaultDetails;

  if (!signal) {
    return (
      <div className="text-center py-20">
        <p className="text-t-muted">Signal not found.</p>
        <Link href="/dashboard" className="text-accent-green text-sm mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const dirColors: Record<string, string> = {
    buy: "bg-accent-green/10 text-accent-green",
    sell: "bg-accent-red/10 text-accent-red",
    hold: "bg-accent-amber/10 text-accent-amber",
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Back link + header */}
      <div>
        <Link href="/dashboard" className="text-[13px] text-t-muted hover:text-t-secondary transition-colors no-underline mb-4 inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[28px] font-semibold font-mono">{signal.ticker}</span>
          <span className={`text-[13px] font-semibold px-3.5 py-1 rounded-full capitalize ${dirColors[signal.direction]}`}>
            {signal.direction} signal
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent-red/10 text-accent-red capitalize">
            {signal.urgency} urgency
          </span>
          <span className="flex-1" />
          <span className="text-[12px] text-t-muted">Generated {signal.timestamp}</span>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        <MiniMetric label="Combined sentiment" value={signal.sentiment > 0 ? `+${signal.sentiment.toFixed(2)}` : signal.sentiment.toFixed(2)} color="text-accent-green" />
        <MiniMetric label="Confidence" value={`${signal.confidence}%`} />
        <MiniMetric label="Current price" value={details.price} />
        <MiniMetric label={`Target (${details.targetPct} upside)`} value={details.target} color="text-accent-green" />
      </div>

      {/* Sources + Indicators */}
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {/* Signal sources */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-4">Signal sources</div>
          {details.sources.map((src) => (
            <div key={src.name} className="flex items-center gap-3 py-3 border-t border-white/[0.06] text-[13px]">
              <span className="font-medium min-w-[90px]">{src.name}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${src.sentiment > 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"}`}>
                {src.sentiment > 0 ? "Bullish" : "Bearish"} {src.sentiment > 0 ? "+" : ""}{src.sentiment}
              </span>
              <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent-green" style={{ width: `${Math.abs(src.sentiment) * 100}%` }} />
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${src.confirms ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"}`}>
                {src.confirms ? "Confirm" : "Deny"}
              </span>
            </div>
          ))}

          {/* Confidence bar */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] text-t-muted uppercase tracking-wider mb-3">Confidence breakdown</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent-green" style={{ width: `${signal.confidence}%` }} />
              </div>
              <span className="text-[14px] font-semibold font-mono">{signal.confidence}%</span>
            </div>
            <p className="text-[12px] text-t-secondary mt-2 leading-relaxed">
              All signal sources agree on direction. High confluence = high confidence.
            </p>
          </div>
        </div>

        {/* Technical indicators */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-4">Technical indicators</div>
          {details.indicators.map((ind) => (
            <div key={ind.name} className="flex items-center gap-3 py-3 border-t border-white/[0.06] text-[13px]">
              <span className="text-t-secondary min-w-[90px]">{ind.name}</span>
              <span className="font-mono font-medium min-w-[44px]">{ind.value}</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green">{ind.signal}</span>
              <span className="text-[12px] text-t-muted">{ind.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Causal reasoning chain */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
        <div className="text-[11px] text-t-muted uppercase tracking-wider mb-4">Causal reasoning chain</div>
        {details.chain.map((step, i) => (
          <div key={i}>
            <div className="flex gap-3 py-3">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[12px] font-medium text-t-muted flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="text-[13px] font-medium leading-snug">{step.title}</div>
                <div className="text-[12px] text-t-secondary mt-1 leading-relaxed">{step.detail}</div>
              </div>
            </div>
            {i < details.chain.length - 1 && (
              <div className="text-center text-t-muted text-[12px] py-1 pl-3">&#8595;</div>
            )}
          </div>
        ))}
      </div>

      {/* News + Risk */}
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        {/* Supporting news */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-4">Supporting news</div>
          {details.news.map((n, i) => (
            <div key={i} className="py-3 border-t border-white/[0.06]">
              <div className="text-[13px] font-medium leading-snug">{n.headline}</div>
              <div className="flex gap-2 items-center mt-1.5 text-[11px] text-t-muted">
                <span>{n.source}</span>
                <span className={`font-medium px-2 py-0.5 rounded-full ${n.sentiment > 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"}`}>
                  {n.sentiment > 0 ? "+" : ""}{n.sentiment}
                </span>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Risk assessment */}
        <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-4">Risk assessment</div>

          <div className="flex flex-col gap-0">
            <RiskRow label="Suggested entry" value={`${details.price}`} />
            <RiskRow label="Stop-loss" value={`${details.stopLoss} (${details.stopPct})`} color="text-accent-red" />
            <RiskRow label="Target price" value={`${details.target} (+${details.targetPct})`} color="text-accent-green" />
            <RiskRow label="Risk/reward" value={details.riskReward} />
            <RiskRow label="Position size (2% risk)" value={details.positionSize} />
            <RiskRow label="Portfolio exposure" value={details.techExposure} />
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] text-t-muted uppercase tracking-wider mb-2">Contrarian risks</div>
            <p className="text-[12px] text-t-secondary leading-relaxed">{details.risks}</p>
          </div>

          <div className="flex gap-3 mt-5">
            <button className="flex-1 py-2.5 text-[13px] font-semibold rounded-lg bg-accent-green/15 text-accent-green border border-accent-green/20 hover:bg-accent-green/25 transition-colors">
              Accept signal
            </button>
            <button className="flex-1 py-2.5 text-[13px] font-medium rounded-lg border border-white/[0.1] text-t-secondary hover:text-t-primary hover:border-white/[0.2] transition-colors">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color = "text-t-primary" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl px-4 py-3.5 text-center">
      <div className={`text-[22px] font-semibold font-mono ${color}`}>{value}</div>
      <div className="text-[11px] text-t-muted mt-1">{label}</div>
    </div>
  );
}

function RiskRow({ label, value, color = "text-t-primary" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/[0.06] last:border-b-0 text-[13px]">
      <span className="text-t-secondary">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}
