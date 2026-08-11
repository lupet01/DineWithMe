import type { DinnerStatus } from "@prisma/client";
import { dinnerRepository } from "@dinewithme/db";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { UrlTabs } from "@/components/ui/url-tabs";
import { TableSearch } from "@/components/ui/table-search";
import { Pagination } from "@/components/ui/pagination";
import { OpsDinnersTable } from "./components/ops-dinners-table";

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Only known tab values map to a status filter; anything else is ignored so a
// hand-edited ?status= can never reach Prisma as an invalid enum value.
const STATUS_VALUES: Record<string, DinnerStatus> = {
  scheduled: "SCHEDULED",
  live: "LIVE",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

export default async function OpsDinnersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.q ?? "";
  const status = searchParams.status ? STATUS_VALUES[searchParams.status] : undefined;

  const [{ dinners, total }, counts] = await Promise.all([
    dinnerRepository.findManyWithThemePaginated({
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      search,
      status,
    }),
    dinnerRepository.countByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Dinners</h2>
        <p className="text-gray-600 mt-1">Every dinner across every restaurant</p>
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard label="Scheduled" value={counts.SCHEDULED} />
        <StatCard label="Live" value={<span className="text-green-600">{counts.LIVE}</span>} />
        <StatCard label="Completed" value={counts.COMPLETED} />
        <StatCard label="Cancelled" value={<span className="text-red-600">{counts.CANCELLED}</span>} />
      </StatGrid>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UrlTabs param="status" items={STATUS_TABS} />
        <TableSearch placeholder="Search restaurant or theme…" className="sm:w-64" />
      </div>

      <OpsDinnersTable dinners={dinners} />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
