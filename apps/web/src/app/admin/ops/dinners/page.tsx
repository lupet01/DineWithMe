import { dinnerRepository } from "@dinewithme/db";
import { OpsDinnersTable } from "./components/ops-dinners-table";
import { StatCard, StatGrid } from "@/components/ui/stat-card";

export default async function OpsDinnersPage() {
  const dinners = await dinnerRepository.findManyWithTheme();

  const scheduledCount = dinners.filter((d) => d.status === "SCHEDULED").length;
  const liveCount = dinners.filter((d) => d.status === "LIVE").length;
  const completedCount = dinners.filter((d) => d.status === "COMPLETED").length;
  const cancelledCount = dinners.filter((d) => d.status === "CANCELLED").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dinners</h2>
        <p className="text-gray-600 mt-1">Every dinner across every restaurant</p>
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard label="Scheduled" value={scheduledCount} />
        <StatCard label="Live" value={<span className="text-green-600">{liveCount}</span>} />
        <StatCard label="Completed" value={completedCount} />
        <StatCard label="Cancelled" value={<span className="text-red-600">{cancelledCount}</span>} />
      </StatGrid>

      <OpsDinnersTable dinners={dinners} />
    </div>
  );
}
