import { getAuthUser } from "@/lib/auth/server";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {user?.firstName || user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-600 mb-1">
            Total Dinners
          </div>
          <div className="text-3xl font-semibold text-slate-900">0</div>
          <div className="text-xs text-slate-500 mt-2">No dinners yet</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-600 mb-1">
            Active Seats
          </div>
          <div className="text-3xl font-semibold text-slate-900">0</div>
          <div className="text-xs text-slate-500 mt-2">No active seats</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm font-medium text-slate-600 mb-1">
            Total Guests
          </div>
          <div className="text-3xl font-semibold text-slate-900">0</div>
          <div className="text-xs text-slate-500 mt-2">No guests yet</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
              ➕
            </div>
            <div>
              <div className="font-medium text-slate-900">Create Dinner</div>
              <div className="text-sm text-slate-600">
                Set up a new dining experience
              </div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
              🍽️
            </div>
            <div>
              <div className="font-medium text-slate-900">
                Update Restaurant
              </div>
              <div className="text-sm text-slate-600">
                Edit your restaurant profile
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-12 text-slate-500">
          <div className="text-4xl mb-3">📊</div>
          <div className="text-sm">No recent activity</div>
        </div>
      </div>
    </div>
  );
}
