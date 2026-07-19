import { userRepository } from "@dinewithme/db";
import { getCurrentUser } from "@/lib/auth/server";
import { UsersTable } from "./components/users-table";

export default async function OpsUsersPage() {
  const [users, currentUser] = await Promise.all([
    userRepository.findMany(),
    getCurrentUser(),
  ]);

  const counts = {
    diner: users.filter((u) => u.role === "DINER").length,
    restaurantAdmin: users.filter((u) => u.role === "RESTAURANT_ADMIN").length,
    platformAdmin: users.filter((u) => u.role === "PLATFORM_ADMIN").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
        <p className="text-slate-600 mt-1">
          View all users and manage their platform roles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Users</div>
          <div className="text-2xl font-semibold text-slate-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Diners</div>
          <div className="text-2xl font-semibold text-slate-900">{counts.diner}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Restaurant Admins</div>
          <div className="text-2xl font-semibold text-blue-600">{counts.restaurantAdmin}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Platform Admins</div>
          <div className="text-2xl font-semibold text-purple-600">{counts.platformAdmin}</div>
        </div>
      </div>

      {/* Table */}
      <UsersTable users={users} currentUserId={currentUser?.id ?? null} />
    </div>
  );
}
