import { redirect } from "next/navigation";
import Link from "next/link";
import { dinnerRepository, restaurantRepository } from "@dinewithme/db";
import { getAuthUser } from "@/lib/auth/server";
import { DinnersTable } from "./components/dinners-table";
import { MobileSubTabs } from "../components/mobile-sub-tabs";

const dinnersTabs = [
  { label: "Dinners", href: "/admin/dinners" },
  { label: "Guests & Bookings", href: "/admin/guests" },
];

export default async function DinnersPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get the admin's own restaurant - findManyWithTheme(restaurantId) below
  // is what actually scopes the query; without it this list would leak
  // every restaurant's dinners to any restaurant admin.
  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  const dinners = await dinnerRepository.findManyWithTheme(restaurant.id);

  return (
    <div className="din">
      <MobileSubTabs tabs={dinnersTabs} marginBottom={14} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="pg-title">Dinners</h1>
            <p className="pg-sub">Manage your upcoming and past dinner events</p>
          </div>
          <Link href="/admin/dinners/new" className="btn btn-primary">
            Create Dinner
          </Link>
        </div>
      </div>

      <DinnersTable dinners={dinners} />
    </div>
  );
}
