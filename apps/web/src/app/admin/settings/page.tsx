import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, restaurantClosureRequestRepository } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { RestaurantLifecycleSettings } from "./components/restaurant-lifecycle-settings";

export default async function SettingsPage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  if (!restaurant) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        </div>
        <Card padding="lg">
          <p className="text-sm text-gray-600">
            Set up your restaurant profile first to access these settings.
          </p>
        </Card>
      </div>
    );
  }

  const pendingClosureRequest = await restaurantClosureRequestRepository.findPendingByRestaurant(
    restaurant.id
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your restaurant&apos;s visibility on DineWithMe</p>
      </div>

      <RestaurantLifecycleSettings
        restaurant={restaurant}
        pendingClosureRequest={pendingClosureRequest}
      />
    </div>
  );
}
