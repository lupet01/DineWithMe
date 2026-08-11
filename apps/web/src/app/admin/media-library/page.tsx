import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, mediaAssetRepository } from "@dinewithme/db";
import { MediaLibraryGrid } from "./components/media-library-grid";

export default async function MediaLibraryPage() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  if (!restaurant) {
    return (
      <div className="media-library mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10 }}>
          <Link href="/admin/restaurant" className="m-icon-btn" aria-label="Back to Restaurant Profile">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>Media Library</h1>
          <div style={{ width: 44 }} />
        </div>
        <h1 className="pg-title only-desktop">Media Library</h1>
        <div className="card card-pad">
          <p style={{ fontSize: 13, color: "var(--t3)" }}>
            Set up your restaurant profile first to manage photos here.
          </p>
        </div>
      </div>
    );
  }

  const items = await mediaAssetRepository.findLibraryByRestaurant(restaurant.id);

  return (
    <div className="media-library mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <MediaLibraryGrid restaurantId={restaurant.id} items={items} />
    </div>
  );
}
