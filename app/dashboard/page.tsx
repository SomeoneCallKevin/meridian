import MetricCards from "@/components/dashboard/MetricCards";
import SignalList from "@/components/dashboard/SignalList";
import NewsFeed from "@/components/dashboard/NewsFeed";
import PositionsTable from "@/components/dashboard/PositionsTable";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics row */}
      <MetricCards />

      {/* Signals + News side by side */}
      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <SignalList />
        <NewsFeed />
      </div>

      {/* Positions table */}
      <PositionsTable />
    </div>
  );
}
