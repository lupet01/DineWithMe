import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, seatRepository } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { GuestsTable } from "./components/guests-table";

export default async function GuestsPage() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  if (!restaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Guests & Bookings</h1>
        </div>
        <Card padding="lg" className="text-center text-gray-600">
          Set up your restaurant profile first to see guest bookings here.
        </Card>
      </div>
    );
  }

  const guests = await seatRepository.findGuestsByRestaurant(restaurant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Guests & Bookings</h1>
        <p className="text-gray-600 mt-1">
          Everyone who has booked a table across all your dinners
        </p>
      </div>

      <GuestsTable guests={guests} restaurantId={restaurant.id} />
    </div>
  );
}
