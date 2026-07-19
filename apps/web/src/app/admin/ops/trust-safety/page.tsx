import { safetyReportRepository } from "@dinewithme/db";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ReportsList } from "./components/reports-list";

export default async function TrustSafetyPage() {
  const [reports, statusCounts] = await Promise.all([
    safetyReportRepository.findMany(),
    safetyReportRepository.countByStatus(),
  ]);

  const openCount = statusCounts.PENDING + statusCounts.REVIEWED;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Trust &amp; Safety</h1>
        <p className="mt-1 text-gray-600">
          Review reports diners file through the post-dinner Safety step
        </p>
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard label="Open" value={openCount} />
        <StatCard label="Actioned" value={statusCounts.ACTIONED} />
        <StatCard label="Dismissed" value={statusCounts.DISMISSED} />
        <StatCard label="Total" value={reports.length} />
      </StatGrid>

      <ReportsList reports={reports} />
    </div>
  );
}
