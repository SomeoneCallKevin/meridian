import { mockPositions, type Position } from "@/lib/mockData";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "within-limits": {
    bg: "bg-accent-green/10",
    text: "text-accent-green",
    label: "Within limits",
  },
  "near-stop": {
    bg: "bg-accent-amber/10",
    text: "text-accent-amber",
    label: "Near stop-loss",
  },
  "stop-triggered": {
    bg: "bg-accent-red/10",
    text: "text-accent-red",
    label: "Stop triggered",
  },
};

function formatPrice(price: number): string {
  if (price >= 10000) return `$${price.toLocaleString()}`;
  return `$${price.toFixed(2)}`;
}

export default function PositionsTable() {
  return (
    <div className="bg-surface border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8ECF1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          <span className="font-semibold text-[15px]">Open positions</span>
        </div>
        <span className="text-[12px] text-t-muted">{mockPositions.length} active</span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_90px_90px_70px_100px_120px] gap-2 text-[11px] text-t-muted uppercase tracking-wider pb-3 border-b border-white/[0.06]">
        <span>Asset</span>
        <span>Entry</span>
        <span>Current</span>
        <span>P&L</span>
        <span>Signal basis</span>
        <span>Risk status</span>
      </div>

      {/* Rows */}
      {mockPositions.map((pos) => (
        <PositionRow key={pos.ticker} position={pos} />
      ))}
    </div>
  );
}

function PositionRow({ position }: { position: Position }) {
  const status = statusStyles[position.riskStatus];
  const isProfitable = position.pnl >= 0;

  return (
    <div className="grid grid-cols-[1fr_90px_90px_70px_100px_120px] gap-2 items-center py-3 border-b border-white/[0.06] last:border-b-0 text-[13px]">
      <span className="font-mono font-medium">{position.ticker}</span>
      <span className="text-t-secondary">{formatPrice(position.entry)}</span>
      <span className="text-t-primary">{formatPrice(position.current)}</span>
      <span className={isProfitable ? "text-accent-green" : "text-accent-red"}>
        {isProfitable ? "+" : ""}
        {position.pnl}%
      </span>
      <span className="text-t-muted text-[12px]">{position.signalBasis}</span>
      <span
        className={`text-[10px] font-medium px-2.5 py-1 rounded-full inline-flex w-fit ${status.bg} ${status.text}`}
      >
        {status.label}
      </span>
    </div>
  );
}
