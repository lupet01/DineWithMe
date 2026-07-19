import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, themeRepository } from "@dinewithme/db";
import { RestaurantForm } from "./components/restaurant-form";
import { ImageUpload } from "./components/image-upload";
import { GalleryManager } from "./components/gallery-manager";
import { ThemeManager } from "./components/theme-manager";

export default async function RestaurantProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  // Get user's restaurant with media
  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;
  
  // Get media if restaurant exists
  const restaurantWithMedia = restaurant
    ? await restaurantRepository.findByIdWithMedia(restaurant.id)
    : null;

  // Onboarding mode: no restaurant yet
  if (!restaurant) {
    return (
      <div className="space-y-8">
        {/* Onboarding Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🍽️</div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Welcome to DineWithMe
          </h1>
          <p className="text-slate-600 mt-2">
            Let&apos;s set up your restaurant profile to start hosting amazing dining
            experiences
          </p>
        </div>

        {/* Onboarding Form */}
        <RestaurantForm mode="create" />
      </div>
    );
  }

  // Edit mode: restaurant exists
  // Get all active themes
  const allThemes = await themeRepository.findActive();
  
  // Get enabled themes for this restaurant
  const enabledThemes = await themeRepository.findByRestaurant(restaurant.id);
  const enabledThemeIds = enabledThemes.map((t) => t.id);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Restaurant Profile
        </h1>
        <p className="text-slate-600 mt-1">
          Manage your restaurant information and settings
        </p>
      </div>

      {/* Edit Form */}
      <RestaurantForm restaurant={restaurant} mode="edit" />

      {/* Theme Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Table Themes
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Choose which types of dining experiences you&apos;d like to host
          </p>
        </div>

        <ThemeManager
          restaurantId={restaurant.id}
          allThemes={allThemes}
          enabledThemeIds={enabledThemeIds}
        />
      </div>

      {/* Media Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Media</h2>
          <p className="text-sm text-slate-600 mt-1">
            Upload images to showcase your restaurant
          </p>
        </div>

        {/* Hero Image */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Hero Image
          </label>
          <ImageUpload
            restaurantId={restaurant.id}
            type="hero"
            currentImage={restaurant.heroImageUrl}
          />
        </div>

        {/* Gallery */}
        <div className="border-t border-slate-200 pt-6">
          <GalleryManager
            restaurantId={restaurant.id}
            media={restaurantWithMedia?.media || []}
          />
        </div>
      </div>
    </div>
  );
}
