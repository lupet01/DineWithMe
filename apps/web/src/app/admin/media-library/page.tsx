import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, restaurantGalleryItemRepository } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
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
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
        <Card padding="lg" className="text-center text-gray-600">
          Set up your restaurant profile first to manage photos here.
        </Card>
      </div>
    );
  }

  const items = await restaurantGalleryItemRepository.findByRestaurant(restaurant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Media Library</h1>
        <p className="text-gray-600 mt-1">
          Every photo your restaurant has uploaded, in one place. Tap any tile to set it as your
          featured cover photo.
        </p>
      </div>

      <MediaLibraryGrid restaurantId={restaurant.id} items={items} />
    </div>
  );
}
