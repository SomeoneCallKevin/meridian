export default function DashboardPreview() {
  return (
    <section className="py-20">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="bg-surface border border-white/[0.06] rounded-[20px] p-0.5 relative overflow-hidden animate-fade-up-3">
          {/* Top glow line */}
          <div className="absolute top-[-1px] left-1/2 -translate-x-1/2 w-[300px] h-px bg-gradient-to-r from-transparent via-accent-green to-transparent" />

          {/* Browser bar */}
          <div className="flex items-center gap-2 px-[18px] py-3 border-b border-white/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-red/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent-green/70" />
            <span className="flex-1 text-center text-xs text-t-muted font-mono">
              app.meridian.trade/dashboard
            </span>
          </div>

          {/* Body */}
          <div className="p-6 grid grid-cols-4 gap-4 max-md:grid-cols-2">
            {/* Metrics */}
            <Metric label="Portfolio" value="$48,230" sub="+2.4% today" subColor="text-accent-green" />
            <Metric label="Active signals" value="7" sub="3 high urgency" subColor="text-accent-amber" />
            <Metric label="Accuracy (30d)" value="68%" sub="142 / 209" subColor="text-t-secondary" />
            <Metric label="Positions" value="5" sub="4 profitable" subColor="text-accent-green" />

            {/* Signals */}
            <div className="col-span-2 bg-card border border-white/[0.06] rounded-lg p-4">
              <div className="text-[13px] font-semibold mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h2l2-4 3 8 2-4h3" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Trade signals
              </div>
              <SignalLine ticker="NVDA" dir="buy" reason="AI chip demand + earnings beat" conf={85} />
              <SignalLine ticker="CL" dir="sell" reason="OPEC+ production increase" conf={60} />
              <SignalLine ticker="BTC" dir="hold" reason="ETF inflows vs regulation" conf={40} />
            </div>

            {/* News */}
            <div className="col-span-2 bg-card border border-white/[0.06] rounded-lg p-4">
              <div className="text-[13px] font-semibold mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="2" stroke="#3B8FF0" strokeWidth="1.5" />
                  <path d="M5 6h6M5 9h4" stroke="#3B8FF0" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                News feed
              </div>
              <NewsLine headline="NVIDIA reports Q4 revenue up 265% on data center demand" sentiment="+0.9" sentColor="bg-accent-green" source="Bloomberg" time="1h" />
              <NewsLine headline="Iran warns of shipping disruptions in Strait of Hormuz" sentiment="-0.7" sentColor="bg-accent-red" source="AP" time="2h" />
              <NewsLine headline="Fed signals extended rate pause through Q3" sentiment="+0.4" sentColor="bg-accent-green" source="WSJ" time="3h" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div className="bg-card border border-white/[0.06] rounded-lg p-4">
      <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-[22px] font-semibold font-mono">{value}</div>
      <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>
    </div>
  );
}

function SignalLine({ ticker, dir, reason, conf }: { ticker: string; dir: string; reason: string; conf: number }) {
  const colors: Record<string, string> = {
    buy: "bg-accent-green/10 text-accent-green",
    sell: "bg-accent-red/10 text-accent-red",
    hold: "bg-accent-amber/10 text-accent-amber",
  };
  const barColors: Record<string, string> = {
    buy: "bg-accent-green",
    sell: "bg-accent-amber",
    hold: "bg-accent-blue",
  };
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-t border-white/[0.06] text-[13px]">
      <span className="font-mono font-medium min-w-[48px]">{ticker}</span>
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${colors[dir]}`}>{dir}</span>
      <span className="text-t-secondary flex-1">{reason}</span>
      <div className="w-[50px] h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColors[dir]}`} style={{ width: `${conf}%` }} />
      </div>
    </div>
  );
}

function NewsLine({ headline, sentiment, sentColor, source, time }: { headline: string; sentiment: string; sentColor: string; source: string; time: string }) {
  return (
    <div className="py-2.5 border-t border-white/[0.06]">
      <div className="text-[13px] leading-snug mb-1">{headline}</div>
      <div className="flex gap-2.5 text-[11px] text-t-muted items-center">
        <span className={`w-[7px] h-[7px] rounded-full ${sentColor}`} />
        <span>Bullish {sentiment}</span>
        <span>{source}</span>
        <span>{time}</span>
      </div>
    </div>
  );
}
