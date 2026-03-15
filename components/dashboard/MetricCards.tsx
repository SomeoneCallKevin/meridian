const metrics = [
  { label: "Portfolio value", value: "$48,230", sub: "+2.4% today", subColor: "text-accent-green" },
  { label: "Active signals", value: "7", sub: "3 high urgency", subColor: "text-accent-amber" },
  { label: "Signal accuracy (30d)", value: "68%", sub: "142 of 209 correct", subColor: "text-t-secondary" },
  { label: "Open positions", value: "5", sub: "4 profitable", subColor: "text-accent-green" },
];

export default function MetricCards() {
  return (
    <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-surface border border-white/[0.06] rounded-xl px-5 py-4"
        >
          <div className="text-[11px] text-t-muted uppercase tracking-wider mb-1">
            {m.label}
          </div>
          <div className="text-[24px] font-semibold font-mono tracking-tight">
            {m.value}
          </div>
          <div className={`text-xs mt-1 ${m.subColor}`}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}
