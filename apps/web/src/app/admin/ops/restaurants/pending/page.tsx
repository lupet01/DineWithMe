import { restaurantRepository } from "@dinewithme/db";
import { RestaurantsTable } from "../components/restaurants-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PendingRestaurantsPage() {
  // Fetch only pending restaurants
  const pendingRestaurants = await restaurantRepository.findPending();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ops/restaurants"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Pending Restaurant Approvals
          </h2>
          <p className="text-slate-600 mt-1">
            {pendingRestaurants.length} restaurant{pendingRestaurants.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>
      </div>

      {/* Empty state */}
      {pendingRestaurants.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              All caught up!
            </h3>
            <p className="text-slate-600">
              There are no pending restaurant applications at the moment.
            </p>
          </div>
        </div>
      ) : (
        <RestaurantsTable restaurants={pendingRestaurants} />
      )}
    </div>
  );
}
