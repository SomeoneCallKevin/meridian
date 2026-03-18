// ─── Core Types ─────────────────────────────────────────────
// Shared type definitions across the Meridian platform

// ─── Data Ingestion ────────────────────────────────────────

export type DataSource =
  | "finnhub"
  | "reddit"
  | "twitter"
  | "rss"
  | "macro-calendar"
  | "technical";

export type AssetClass = "equity" | "crypto" | "commodity" | "forex" | "index";

export type Ticker = {
  symbol: string;
  name: string;
  assetClass: AssetClass;
};

// ─── Macro Calendar ────────────────────────────────────────

export type MacroEventType =
  | "fed-rate"
  | "cpi"
  | "gdp"
  | "jobs"
  | "pmi"
  | "opec"
  | "earnings"
  | "other";

export type MacroEvent = {
  id: string;
  title: string;
  type: MacroEventType;
  date: string; // ISO date
  time: string | null; // HH:MM UTC or null if all-day
  country: string;
  impact: "high" | "medium" | "low";
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  description: string;
  affectedAssets: string[]; // ticker symbols
};

// ─── Social Signals ────────────────────────────────────────

export type SocialPlatform = "reddit" | "twitter" | "stocktwits";

export type SocialPost = {
  id: string;
  platform: SocialPlatform;
  author: string;
  content: string;
  timestamp: number;
  url: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  tickers: string[];
  sentiment: number; // -1 to 1
};

export type SocialAggregation = {
  ticker: string;
  mentions: number;
  avgSentiment: number;
  volumeChange: number; // % change vs 24h ago
  topPosts: SocialPost[];
  platforms: SocialPlatform[];
  updatedAt: string;
};

// ─── Technical Analysis ────────────────────────────────────

export type TechnicalIndicator = {
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
};

export type TechnicalAnalysis = {
  ticker: string;
  indicators: TechnicalIndicator[];
  overallSignal: "bullish" | "bearish" | "neutral";
  confidence: number; // 0-1
  patterns: string[]; // e.g. "Double bottom", "Head and shoulders"
  support: number[];
  resistance: number[];
  updatedAt: string;
};

// ─── Signal Fusion ─────────────────────────────────────────

export type SignalSourceType =
  | "news-nlp"
  | "technical"
  | "social"
  | "macro"
  | "geopolitical"
  | "price-action";

export type SignalSource = {
  type: SignalSourceType;
  weight: number; // 0-1, how much this source contributes
  sentiment: number; // -1 to 1
  confidence: number; // 0-1
  reasoning: string;
  data?: Record<string, unknown>; // source-specific payload
};

export type ExplainabilityStep = {
  order: number;
  source: SignalSourceType;
  observation: string;
  impact: "supports" | "contradicts" | "neutral";
  weight: number;
};

export type FusedSignal = {
  id: string;
  ticker: string;
  direction: "buy" | "sell" | "hold";
  confidence: number; // 0-100
  urgency: "high" | "med" | "low";
  sentiment: number; // -1 to 1
  sources: SignalSource[];
  explainability: ExplainabilityStep[];
  timestamp: string;
  priceData: {
    price: number;
    change: number;
    changePercent: number;
  } | null;
  reason: string;
  newsCount: number;
  topNews: { headline: string; sentiment: number; source: string }[];
  causalChain: string[];
};

// ─── Backtesting ───────────────────────────────────────────

export type BacktestConfig = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  signalSources: SignalSourceType[];
  minConfidence: number;
  maxPositionSize: number; // % of portfolio
  stopLossPercent: number;
  takeProfitPercent: number;
};

export type BacktestTrade = {
  id: string;
  ticker: string;
  direction: "buy" | "sell";
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  pnlPercent: number;
  pnlAmount: number;
  signalConfidence: number;
  exitReason: "take-profit" | "stop-loss" | "signal-reversal" | "end-of-period";
};

export type BacktestResult = {
  id: string;
  config: BacktestConfig;
  trades: BacktestTrade[];
  metrics: {
    totalTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
    totalReturn: number;
    profitFactor: number;
  };
  equityCurve: { date: string; value: number }[];
  completedAt: string;
};

// ─── Decision Layer ────────────────────────────────────────

// Watchlist
export type WatchlistItem = {
  ticker: string;
  addedAt: string;
  notes: string;
  alerts: WatchlistAlert[];
};

export type WatchlistAlert = {
  id: string;
  type: "price-above" | "price-below" | "sentiment-change" | "new-signal" | "volume-spike";
  threshold: number | null;
  enabled: boolean;
  lastTriggered: string | null;
};

// Alerts & Notifications
export type AlertRule = {
  id: string;
  name: string;
  enabled: boolean;
  conditions: AlertCondition[];
  action: "notify" | "auto-trade";
  createdAt: string;
};

export type AlertCondition = {
  field: "confidence" | "urgency" | "direction" | "ticker" | "sentiment" | "source";
  operator: "gt" | "lt" | "eq" | "contains";
  value: string | number;
};

export type Notification = {
  id: string;
  type: "signal" | "alert" | "macro-event" | "watchlist" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
};

// Correlation Heatmap
export type CorrelationPair = {
  tickerA: string;
  tickerB: string;
  correlation: number; // -1 to 1
  period: "1w" | "1m" | "3m" | "1y";
};

// Performance Attribution
export type SourcePerformance = {
  source: SignalSourceType;
  totalSignals: number;
  winRate: number;
  avgReturn: number;
  bestTrade: { ticker: string; pnl: number };
  worstTrade: { ticker: string; pnl: number };
};

// ─── Paper Trading ─────────────────────────────────────────

export type PaperAccount = {
  id: string;
  name: string;
  initialCapital: number;
  cash: number;
  positions: PaperPosition[];
  closedTrades: PaperTrade[];
  createdAt: string;
};

export type PaperPosition = {
  ticker: string;
  shares: number;
  entryPrice: number;
  entryDate: string;
  currentPrice: number;
  signalId: string | null;
  stopLoss: number | null;
  takeProfit: number | null;
};

export type PaperTrade = {
  id: string;
  ticker: string;
  direction: "buy" | "sell";
  shares: number;
  entryPrice: number;
  entryDate: string;
  exitPrice: number;
  exitDate: string;
  pnl: number;
  pnlPercent: number;
  signalId: string | null;
  exitReason: string;
};

// ─── Settings / User Preferences ───────────────────────────

export type ViewMode = "beginner" | "advanced" | "full";

export type UserSettings = {
  viewMode: ViewMode;
  riskPerTrade: number;
  maxSectorExposure: number;
  defaultStopLoss: number;
  minConfidenceThreshold: number;
  requiredSignalSources: number;
  enableAlerts: boolean;
  highUrgencyOnly: boolean;
  paperTradingMode: boolean;
};
