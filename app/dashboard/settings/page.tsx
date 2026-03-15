"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [riskPct, setRiskPct] = useState("2");
  const [maxExposure, setMaxExposure] = useState("35");
  const [stopLoss, setStopLoss] = useState("5");
  const [notifications, setNotifications] = useState(true);
  const [highUrgOnly, setHighUrgOnly] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-t-muted mt-1">
          Configure your trading parameters and notification preferences
        </p>
      </div>

      {/* Risk management */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold mb-5">Risk management</h3>

        <div className="flex flex-col gap-5">
          <SettingRow
            label="Risk per trade"
            description="Maximum percentage of portfolio to risk on a single trade"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                className="w-[80px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-t-primary text-right outline-none focus:border-accent-green/30 transition-colors font-mono"
              />
              <span className="text-[13px] text-t-muted">%</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Max sector exposure"
            description="Maximum portfolio allocation to any single sector"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxExposure}
                onChange={(e) => setMaxExposure(e.target.value)}
                className="w-[80px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-t-primary text-right outline-none focus:border-accent-green/30 transition-colors font-mono"
              />
              <span className="text-[13px] text-t-muted">%</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Default stop-loss"
            description="Automatic stop-loss percentage below entry price"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-[80px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-t-primary text-right outline-none focus:border-accent-green/30 transition-colors font-mono"
              />
              <span className="text-[13px] text-t-muted">%</span>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Signal preferences */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold mb-5">Signal preferences</h3>

        <div className="flex flex-col gap-5">
          <SettingRow
            label="Minimum confidence threshold"
            description="Only show signals above this confidence level"
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="40"
                className="w-[140px] accent-[#22D68A]"
              />
              <span className="text-[13px] font-mono text-t-primary min-w-[36px] text-right">40%</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Required signal sources"
            description="Minimum number of confirming sources before a signal is shown"
          >
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`w-10 h-10 rounded-lg text-[13px] font-medium transition-colors ${
                    n === 2
                      ? "bg-accent-green/15 text-accent-green border border-accent-green/20"
                      : "bg-white/[0.04] text-t-muted border border-white/[0.06] hover:text-t-secondary"
                  }`}
                >
                  {n}+
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold mb-5">Notifications</h3>

        <div className="flex flex-col gap-5">
          <SettingRow
            label="Enable signal alerts"
            description="Get notified when new trade signals are generated"
          >
            <Toggle checked={notifications} onChange={setNotifications} />
          </SettingRow>

          <SettingRow
            label="High urgency only"
            description="Only send notifications for high urgency signals"
          >
            <Toggle checked={highUrgOnly} onChange={setHighUrgOnly} />
          </SettingRow>
        </div>
      </div>

      {/* API keys (placeholder) */}
      <div className="bg-surface border border-white/[0.06] rounded-xl p-6">
        <h3 className="text-[15px] font-semibold mb-2">API connections</h3>
        <p className="text-[13px] text-t-muted mb-5">
          Connect your data sources to enable live signals
        </p>

        <div className="flex flex-col gap-3">
          <ApiRow name="News API" status="Not connected" connected={false} />
          <ApiRow name="Market data (Polygon.io)" status="Not connected" connected={false} />
          <ApiRow name="Claude API (Anthropic)" status="Not connected" connected={false} />
          <ApiRow name="Binance" status="Not connected" connected={false} />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button className="px-6 py-2.5 bg-accent-green text-deep text-sm font-semibold rounded-lg hover:bg-[#2EE89A] transition-colors">
          Save settings
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-8 py-2 border-b border-white/[0.06] last:border-b-0">
      <div>
        <div className="text-[14px] font-medium">{label}</div>
        <div className="text-[12px] text-t-muted mt-0.5">{description}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-[44px] h-[24px] rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-accent-green" : "bg-white/[0.1]"
      }`}
    >
      <span
        className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform ${
          checked ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

function ApiRow({ name, status, connected }: { name: string; status: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-b-0">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-accent-green" : "bg-t-muted"}`} />
        <span className="text-[13px] font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-t-muted">{status}</span>
        <button className="text-[12px] font-medium text-accent-green hover:text-[#2EE89A] transition-colors">
          Connect
        </button>
      </div>
    </div>
  );
}
