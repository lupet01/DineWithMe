import { userRepository, trustProfileRepository } from "@dinewithme/db";
import { TableSearch } from "@/components/ui/table-search";
import { Pagination } from "@/components/ui/pagination";
import { UsersTable } from "./components/users-table";

const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const search = searchParams.q ?? "";

  const [{ users, total }, flaggedProfiles] = await Promise.all([
    userRepository.findManyPaginated({ skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, search }),
    trustProfileRepository.getFlaggedUsers(),
  ]);

  const flaggedUserIds = flaggedProfiles.map((p) => p.userId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <p className="text-gray-600 mt-1">
          {total} user{total !== 1 ? "s" : ""}
          {search ? " matching your search" : " on the platform"}
        </p>
      </div>

      <div className="flex justify-end">
        <TableSearch placeholder="Search by name or email..." className="sm:w-72" />
      </div>

      <UsersTable users={users} flaggedUserIds={flaggedUserIds} />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
