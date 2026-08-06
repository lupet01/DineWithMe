import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  restaurantClosureRequestRepository,
  payoutRepository,
  decrypt,
  maskAccountNumber,
} from "@dinewithme/db";
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
      <div className="settings mx-auto max-w-2xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h1 className="pg-title">Settings</h1>
        </div>
        <div className="card card-pad">
          <p style={{ fontSize: 13, color: "var(--t3)" }}>
            Set up your restaurant profile first to access these settings.
          </p>
        </div>
      </div>
    );
  }

  const pendingClosureRequest = await restaurantClosureRequestRepository.findPendingByRestaurant(
    restaurant.id
  );

  const payouts = await payoutRepository.findByRestaurant(restaurant.id);
  const pendingPayouts = payouts.filter((p) => p.status === "HELD" || p.status === "READY");
  const nextPayoutAmountCents =
    pendingPayouts.length > 0 ? pendingPayouts.reduce((sum, p) => sum + p.netAmountCents, 0) : null;
  const nextPayoutDate = pendingPayouts
    .map((p) => p.scheduledAt)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  // Bank account number is decrypted here, server-side, only to produce a
  // masked display string - the raw decrypted value never leaves this page.
  const maskedAccountNumber = restaurant.bankAccountNumber
    ? maskAccountNumber(decrypt(restaurant.bankAccountNumber))
    : null;

  return (
    <div className="settings mx-auto max-w-2xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 className="pg-title">Settings</h1>
        <p className="pg-sub">Quick management for {restaurant.name}</p>
      </div>

      <RestaurantLifecycleSettings
        restaurant={restaurant}
        pendingClosureRequest={pendingClosureRequest}
        nextPayoutAmountCents={nextPayoutAmountCents}
        nextPayoutDate={nextPayoutDate ? nextPayoutDate.toISOString() : null}
        bankName={restaurant.bankName}
        maskedAccountNumber={maskedAccountNumber}
        verifiedAt={restaurant.bankDetailsVerifiedAt?.toISOString() ?? null}
      />
    </div>
  );
}
