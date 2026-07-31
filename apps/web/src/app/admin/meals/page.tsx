import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, mealRepository } from "@dinewithme/db";
import { NewMealButton } from "./components/new-meal-button";
import { MealsList } from "./components/meals-list";

export default async function MealsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  const meals = await mealRepository.findByRestaurant(restaurant.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Meals</h1>
          <p className="mt-1 text-gray-600">
            Reusable named menus Create Dinner picks from, assembled from your Dish Library.
          </p>
        </div>
        <Link
          href="/admin/dish-library"
          className="whitespace-nowrap text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          Dish Library →
        </Link>
      </div>

      <NewMealButton restaurantId={restaurant.id} />

      <MealsList meals={meals} />
    </div>
  );
}
