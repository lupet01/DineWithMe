import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, themeRepository, restaurantGalleryItemRepository, mealRepository } from "@dinewithme/db";
import { DinnerForm, type MealDishPreview } from "../components/dinner-form";
import { mealCoursesToDishPreview } from "../meal-preview";

export default async function NewDinnerPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user's restaurant
  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];

  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  // Only an active restaurant can create dinners - matches the check in
  // create-actions.ts's createDinner (§16.7). Redirects to the Dashboard
  // rather than rendering a form that will just fail on submit.
  if (restaurant.status !== "ACTIVE") {
    redirect("/admin");
  }

  // Get enabled themes for this restaurant
  const enabledThemes = await themeRepository.findByRestaurant(restaurant.id);

  // Get the restaurant's photo pool for the Listing Photos picker
  const galleryItems = await restaurantGalleryItemRepository.findByRestaurant(restaurant.id);

  // Get the restaurant's active Meals, with course/dish data for the live
  // preview's "Tonight's Menu" panel (§16.3 wireframe).
  const meals = (await mealRepository.findByRestaurantWithCourses(restaurant.id)).filter((m) => m.isActive);

  return (
    <div className="din">
      <p className="pg-sub only-desktop" style={{ marginBottom: 12 }}>
        <Link href="/admin/dinners" style={{ color: "var(--p)", fontWeight: 600 }}>
          ← Dinners
        </Link>{" "}
        / Create Dinner
      </p>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Link href="/admin/dinners" className="m-icon-btn" aria-label="Back to Dinners">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
          Create Dinner
        </h1>
        <div style={{ width: 44 }} />
      </div>
      <div className="only-desktop" style={{ marginBottom: 20 }}>
        <h1 className="pg-title">Create Dinner</h1>
        <p className="pg-sub">Schedule a new dinner event at {restaurant.name}</p>
      </div>

      <DinnerForm
        mode="create"
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        restaurantCuisine={restaurant.cuisine}
        restaurantCity={restaurant.city}
        enabledThemes={enabledThemes.map((t) => ({
          id: t.id,
          key: t.key,
          title: t.title,
          shortDescription: t.shortDescription,
        }))}
        photoPool={galleryItems.map((item) => ({
          id: item.mediaAsset.id,
          url: item.mediaAsset.url,
        }))}
        meals={meals.map((m) => ({
          id: m.id,
          name: m.name,
          suggestedPricePerSeatCents: m.suggestedPricePerSeatCents,
          dishes: mealCoursesToDishPreview(m.courses) as MealDishPreview[],
        }))}
      />
    </div>
  );
}
