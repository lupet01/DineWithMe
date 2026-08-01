import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, seatRepository } from "@dinewithme/db";
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
      <div className="guests">
        <h1 className="pg-title" style={{ marginBottom: 16 }}>
          Guests &amp; Bookings
        </h1>
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
          Set up your restaurant profile first to see guest bookings here.
        </div>
      </div>
    );
  }

  const guests = await seatRepository.findGuestsByRestaurant(restaurant.id);

  return (
    <div className="guests">
      <div style={{ marginBottom: 20 }}>
        <h1 className="pg-title">Guests &amp; Bookings</h1>
        <p className="pg-sub">Everyone who has booked a table across all your dinners</p>
      </div>

      <GuestsTable guests={guests} restaurantId={restaurant.id} />
    </div>
  );
}
