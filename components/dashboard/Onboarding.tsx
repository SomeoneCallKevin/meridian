"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { storeSet } from "@/lib/store";

// Demo data that mimics a realistic starter portfolio
const DEMO_WATCHLIST = [
  { ticker: "AAPL", addedAt: new Date().toISOString(), notes: "", alerts: [] },
  { ticker: "NVDA", addedAt: new Date().toISOString(), notes: "", alerts: [] },
  { ticker: "TSLA", addedAt: new Date().toISOString(), notes: "", alerts: [] },
  { ticker: "BTC", addedAt: new Date().toISOString(), notes: "", alerts: [] },
  { ticker: "MSFT", addedAt: new Date().toISOString(), notes: "", alerts: [] },
];

const DEMO_POSITIONS = [
  {
    id: "demo-1",
    ticker: "NVDA",
    shares: 10,
    entryPrice: 178.5,
    stopLoss: 165.0,
    takeProfit: 210.0,
    notes: "AI chip demand thesis",
    openedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "demo-2",
    ticker: "AAPL",
    shares: 15,
    entryPrice: 248.0,
    stopLoss: 235.0,
    takeProfit: 275.0,
    notes: "Services revenue growth",
    openedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "demo-3",
    ticker: "MSFT",
    shares: 8,
    entryPrice: 395.0,
    stopLoss: 375.0,
    takeProfit: 430.0,
    notes: "Azure cloud momentum",
    openedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_CLOSED = [
  {
    id: "demo-closed-1",
    ticker: "META",
    shares: 12,
    entryPrice: 540.0,
    exitPrice: 575.0,
    pnl: 420.0,
    pnlPercent: 6.48,
    openedAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    closedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "demo-closed-2",
    ticker: "AMZN",
    shares: 10,
    entryPrice: 215.0,
    exitPrice: 208.0,
    pnl: -70.0,
    pnlPercent: -3.26,
    openedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    closedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const STEPS = [
  {
    title: "Welcome to Meridian",
    description:
      "Your AI-powered trading intelligence platform. Let's get you set up.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l3-9 4 18 3-9h6" />
      </svg>
    ),
  },
  {
    title: "Track your portfolio",
    description:
      "Add your positions with entry prices, stop-losses, and take-profit targets. Watch your P&L update in real time.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: "AI-powered signals",
    description:
      "Generate trade signals from real-time news analysis. Our AI reads and interprets market news to surface actionable insights.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 8h10M7 12h6M7 16h8" />
      </svg>
    ),
  },
  {
    title: "Monitor your watchlist",
    description:
      "Track stocks and crypto with live prices, charts, and custom alerts. Search any ticker to add it to your watchlist.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22D68A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Onboarding() {
  const { user, setIsNewUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLastStep = step === STEPS.length - 1;

  const finishOnboarding = async (loadDemo: boolean) => {
    setLoading(true);

    if (loadDemo) {
      // Load demo data into localStorage
      storeSet("watchlist", DEMO_WATCHLIST);
      storeSet("positions-open", DEMO_POSITIONS);
      storeSet("positions-closed", DEMO_CLOSED);
    }

    // Mark onboarding as complete
    storeSet("settings", { onboardingComplete: true, demoLoaded: loadDemo });

    // Brief pause to let sync happen
    await new Promise((r) => setTimeout(r, 500));

    setIsNewUser(false);

    // Force hooks to re-read
    window.dispatchEvent(new Event("meridian-data-sync"));
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-deep/90 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-[520px]">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step
                  ? "bg-accent-green w-6"
                  : i < step
                  ? "bg-accent-green/50"
                  : "bg-white/[0.1]"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface border border-white/[0.06] rounded-2xl p-10 text-center">
          {/* Greeting for first step */}
          {step === 0 && user && (
            <div className="text-accent-green text-[13px] font-medium mb-4">
              Hey {user.name}!
            </div>
          )}

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center">
              {STEPS[step].icon}
            </div>
          </div>

          {/* Content */}
          <h2 className="text-[22px] font-semibold mb-3">{STEPS[step].title}</h2>
          <p className="text-t-secondary text-[14px] leading-relaxed max-w-[380px] mx-auto mb-8">
            {STEPS[step].description}
          </p>

          {/* Actions */}
          {!isLastStep ? (
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStep(step + 1)}
                className="px-8 py-2.5 bg-accent-green text-deep font-semibold text-[14px] rounded-lg hover:bg-[#2EE89A] transition-colors"
              >
                Next
              </button>
              <button
                onClick={() => setStep(STEPS.length - 1)}
                className="px-6 py-2.5 text-t-muted text-[13px] hover:text-t-secondary transition-colors"
              >
                Skip
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-t-muted text-[12px] mb-2">
                How would you like to start?
              </p>
              <button
                onClick={() => finishOnboarding(true)}
                disabled={loading}
                className="w-full py-3 bg-accent-green text-deep font-semibold text-[14px] rounded-lg hover:bg-[#2EE89A] transition-colors disabled:opacity-50"
              >
                {loading ? "Setting up..." : "Load demo portfolio to explore"}
              </button>
              <button
                onClick={() => finishOnboarding(false)}
                disabled={loading}
                className="w-full py-3 border border-white/[0.1] text-t-primary font-medium text-[14px] rounded-lg hover:bg-white/[0.04] transition-colors disabled:opacity-50"
              >
                Start with a clean slate
              </button>
              <p className="text-t-muted/60 text-[11px] mt-1">
                You can always clear demo data later from Settings
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
