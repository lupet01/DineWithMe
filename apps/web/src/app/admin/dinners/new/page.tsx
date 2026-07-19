import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, themeRepository } from "@dinewithme/db";
import { DinnerForm } from "../components/dinner-form";

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

  // Get enabled themes for this restaurant
  const enabledThemes = await themeRepository.findByRestaurant(restaurant.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Create New Dinner
        </h1>
        <p className="text-slate-600 mt-1">
          Schedule a new dining experience for your guests
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <DinnerForm
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          enabledThemes={enabledThemes.map((t) => ({
            id: t.id,
            key: t.key,
            title: t.title,
            shortDescription: t.shortDescription,
          }))}
        />
      </div>
    </div>
  );
}
