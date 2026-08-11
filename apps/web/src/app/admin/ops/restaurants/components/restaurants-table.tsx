import type { Restaurant, RestaurantMember, User } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { RestaurantRow } from "./restaurant-row";

type RestaurantWithMembers = Restaurant & {
  members: (RestaurantMember & { user: User })[];
};

interface RestaurantsTableProps {
  /** Already server-paginated, filtered, and searched by the page. */
  restaurants: RestaurantWithMembers[];
}

export function RestaurantsTable({ restaurants }: RestaurantsTableProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream-100 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {restaurants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No restaurants found for this filter
                </td>
              </tr>
            ) : (
              restaurants.map((restaurant) => (
                <RestaurantRow key={restaurant.id} restaurant={restaurant} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
