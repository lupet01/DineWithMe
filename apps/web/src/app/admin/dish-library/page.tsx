import { redirect } from "next/navigation";
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

  const [menuItems, photoPool, usageCounts] = await Promise.all([
    menuItemRepository.findByRestaurant(restaurant.id),
    mediaAssetRepository.findByRestaurant(restaurant.id),
    menuItemRepository.countMealUsage(restaurant.id),
  ]);

  return (
    <div className="dish-library mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <DishLibraryManager
        restaurantId={restaurant.id}
        menuItems={menuItems}
        photoPool={photoPool.map((asset) => ({ id: asset.id, url: asset.url }))}
        usageCounts={usageCounts}
      />
    </div>
  );
}
