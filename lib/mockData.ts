export type Signal = {
  id: string;
  ticker: string;
  direction: "buy" | "sell" | "hold";
  reason: string;
  confidence: number;
  urgency: "high" | "med" | "low";
  sources: string[];
  sentiment: number;
  timestamp: string;
};

export type NewsItem = {
  id: string;
  headline: string;
  sentiment: number;
  source: string;
  time: string;
  category: "earnings" | "geopolitical" | "macro" | "regulatory";
};

export type Position = {
  ticker: string;
  entry: number;
  current: number;
  pnl: number;
  signalBasis: string;
  riskStatus: "within-limits" | "near-stop" | "stop-triggered";
};

export const mockSignals: Signal[] = [
  {
    id: "sig-1",
    ticker: "NVDA",
    direction: "buy",
    reason: "AI chip demand surge + earnings beat",
    confidence: 85,
    urgency: "high",
    sources: ["News NLP", "Technical", "Social"],
    sentiment: 0.82,
    timestamp: "47m ago",
  },
  {
    id: "sig-2",
    ticker: "CL",
    direction: "sell",
    reason: "OPEC+ production increase expected",
    confidence: 62,
    urgency: "med",
    sources: ["Geopolitical", "Technical"],
    sentiment: -0.54,
    timestamp: "1h ago",
  },
  {
    id: "sig-3",
    ticker: "BTC",
    direction: "hold",
    reason: "Mixed signals: ETF inflows vs regulation",
    confidence: 41,
    urgency: "low",
    sources: ["News NLP", "Social"],
    sentiment: 0.12,
    timestamp: "2h ago",
  },
  {
    id: "sig-4",
    ticker: "XOM",
    direction: "buy",
    reason: "Middle East tensions + RSI oversold",
    confidence: 78,
    urgency: "high",
    sources: ["Geopolitical", "Technical", "News NLP"],
    sentiment: 0.67,
    timestamp: "2h ago",
  },
  {
    id: "sig-5",
    ticker: "TSLA",
    direction: "sell",
    reason: "Delivery miss + margin pressure",
    confidence: 58,
    urgency: "med",
    sources: ["News NLP", "Technical"],
    sentiment: -0.48,
    timestamp: "3h ago",
  },
  {
    id: "sig-6",
    ticker: "ETH",
    direction: "hold",
    reason: "Regulatory uncertainty + network upgrades",
    confidence: 45,
    urgency: "low",
    sources: ["News NLP", "Social"],
    sentiment: 0.08,
    timestamp: "4h ago",
  },
  {
    id: "sig-7",
    ticker: "AMZN",
    direction: "buy",
    reason: "Cloud revenue acceleration + AI integration",
    confidence: 72,
    urgency: "med",
    sources: ["News NLP", "Technical"],
    sentiment: 0.61,
    timestamp: "5h ago",
  },
];

export const mockNews: NewsItem[] = [
  {
    id: "n-1",
    headline: "EU approves sweeping AI regulation framework with strict compute limits",
    sentiment: -0.6,
    source: "Reuters",
    time: "12m ago",
    category: "geopolitical",
  },
  {
    id: "n-2",
    headline: "NVIDIA reports Q4 revenue up 265% on data center demand",
    sentiment: 0.9,
    source: "Bloomberg",
    time: "1h ago",
    category: "earnings",
  },
  {
    id: "n-3",
    headline: "Iran warns of shipping disruptions in Strait of Hormuz",
    sentiment: -0.7,
    source: "AP",
    time: "2h ago",
    category: "geopolitical",
  },
  {
    id: "n-4",
    headline: "Federal Reserve signals extended rate pause through Q3",
    sentiment: 0.4,
    source: "WSJ",
    time: "3h ago",
    category: "macro",
  },
  {
    id: "n-5",
    headline: "SEC opens investigation into three major crypto exchanges",
    sentiment: -0.5,
    source: "CoinDesk",
    time: "4h ago",
    category: "regulatory",
  },
  {
    id: "n-6",
    headline: "Amazon Web Services announces next-gen AI chips to rival NVIDIA",
    sentiment: 0.3,
    source: "TechCrunch",
    time: "5h ago",
    category: "earnings",
  },
  {
    id: "n-7",
    headline: "OPEC+ members signal willingness to increase oil production quotas",
    sentiment: -0.4,
    source: "Reuters",
    time: "6h ago",
    category: "geopolitical",
  },
];

export const mockPositions: Position[] = [
  { ticker: "NVDA", entry: 812.4, current: 878.2, pnl: 8.1, signalBasis: "News + TA", riskStatus: "within-limits" },
  { ticker: "BTC", entry: 62100, current: 64800, pnl: 4.3, signalBasis: "Geopolitical", riskStatus: "within-limits" },
  { ticker: "XOM", entry: 108.5, current: 112.3, pnl: 3.5, signalBasis: "News + TA", riskStatus: "within-limits" },
  { ticker: "ETH", entry: 3420, current: 3380, pnl: -1.2, signalBasis: "Sentiment", riskStatus: "near-stop" },
  { ticker: "TSLA", entry: 245.8, current: 238.1, pnl: -3.1, signalBasis: "TA only", riskStatus: "stop-triggered" },
];
