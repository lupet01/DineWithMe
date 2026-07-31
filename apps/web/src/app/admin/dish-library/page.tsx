import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, menuItemRepository, mediaAssetRepository } from "@dinewithme/db";
import { DishLibraryManager } from "./components/dish-library-manager";

export default async function DishLibraryPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  const [menuItems, photoPool] = await Promise.all([
    menuItemRepository.findByRestaurant(restaurant.id),
    mediaAssetRepository.findByRestaurant(restaurant.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/meals"
          className="rounded-lg p-2 transition-colors hover:bg-cream-200"
          aria-label="Back to Meals"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dish Library</h1>
          <p className="mt-1 text-gray-600">
            Dishes entered and photographed once, assembled into Meals.
          </p>
        </div>
      </div>

      <DishLibraryManager
        restaurantId={restaurant.id}
        menuItems={menuItems}
        photoPool={photoPool.map((asset) => ({ id: asset.id, url: asset.url }))}
      />
    </div>
  );
}
