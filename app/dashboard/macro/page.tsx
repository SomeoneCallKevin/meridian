"use client";

import { useMacroCalendar } from "@/lib/useMacroCalendar";

const impactColors: Record<string, string> = {
  high: "text-accent-red bg-accent-red/10 border-accent-red/20",
  medium: "text-accent-amber bg-accent-amber/10 border-accent-amber/20",
  low: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
};

const typeLabels: Record<string, string> = {
  "fed-rate": "Interest Rate",
  cpi: "CPI / Inflation",
  gdp: "GDP",
  jobs: "Employment",
  pmi: "PMI",
  opec: "OPEC",
  earnings: "Earnings",
  other: "Other",
};

export default function MacroCalendarPage() {
  const { events, loading, upcomingEvents, highImpactEvents, todayEvents } =
    useMacroCalendar();

  return (
    <div className="max-w-[1200px] space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Macro Calendar</h2>
        <p className="text-sm text-t-secondary mt-1">
          Upcoming economic events — Fed, CPI, OPEC, and more
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Total Events</div>
          <div className="text-2xl font-mono font-semibold mt-1">{events.length}</div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">High Impact</div>
          <div className="text-2xl font-mono font-semibold mt-1 text-accent-red">
            {highImpactEvents.length}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Today</div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {todayEvents.length}
          </div>
        </div>
        <div className="bg-card border border-white/[0.06] rounded-xl p-5">
          <div className="text-xs text-t-muted uppercase tracking-wider">Next 7 Days</div>
          <div className="text-2xl font-mono font-semibold mt-1">
            {upcomingEvents.filter((e) => {
              const d = new Date(e.date);
              const now = new Date();
              return d.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </div>
        </div>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="bg-card border border-white/[0.06] rounded-xl p-12 text-center text-t-muted">
          Loading events...
        </div>
      ) : (
        <div className="bg-card border border-white/[0.06] rounded-xl divide-y divide-white/[0.06]">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isToday = eventDate.toDateString() === new Date().toDateString();
            const dayLabel = isToday
              ? "Today"
              : eventDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });

            return (
              <div key={event.id} className="p-5 flex items-start gap-5">
                <div className="w-20 shrink-0">
                  <div className={`text-sm font-medium ${isToday ? "text-accent-green" : "text-t-primary"}`}>
                    {dayLabel}
                  </div>
                  {event.time && (
                    <div className="text-xs text-t-muted font-mono mt-0.5">{event.time} UTC</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-t-primary">{event.title}</h4>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        impactColors[event.impact]
                      }`}
                    >
                      {event.impact}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-t-muted">
                      {typeLabels[event.type] || event.type}
                    </span>
                    <span className="text-xs text-t-muted">
                      {event.country}
                    </span>
                  </div>
                  {event.affectedAssets.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {event.affectedAssets.map((asset) => (
                        <span
                          key={asset}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-t-secondary"
                        >
                          {asset}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
