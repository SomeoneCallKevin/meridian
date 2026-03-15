const tickers = [
  { symbol: "NVDA", price: "$878.20", change: "+3.41%", up: true },
  { symbol: "BTC", price: "$64,800", change: "+1.82%", up: true },
  { symbol: "TSLA", price: "$238.10", change: "-2.14%", up: false },
  { symbol: "CL", price: "$82.40", change: "+0.96%", up: true },
  { symbol: "ETH", price: "$3,380", change: "-0.58%", up: false },
  { symbol: "XOM", price: "$112.30", change: "+2.07%", up: true },
  { symbol: "AAPL", price: "$194.60", change: "+0.73%", up: true },
  { symbol: "GLD", price: "$198.50", change: "+0.32%", up: true },
];

function TickerItem({ symbol, price, change, up }: (typeof tickers)[0]) {
  return (
    <div className="flex items-center gap-3 font-mono text-sm text-t-secondary whitespace-nowrap">
      <span className="text-t-primary font-medium">{symbol}</span>
      {price}
      <span className={up ? "text-accent-green" : "text-accent-red"}>
        {change}
      </span>
    </div>
  );
}

export default function TickerStrip() {
  // Double the items so the scroll loops seamlessly
  const doubled = [...tickers, ...tickers];

  return (
    <div className="py-6 border-t border-b border-white/[0.06] overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-[120px] bg-gradient-to-r from-deep to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-[120px] bg-gradient-to-l from-deep to-transparent z-10 pointer-events-none" />

      <div className="flex gap-12 animate-scroll-ticker w-max">
        {doubled.map((t, i) => (
          <TickerItem key={i} {...t} />
        ))}
      </div>
    </div>
  );
}
