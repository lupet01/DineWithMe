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
    <div className="meals mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="pg-title">Meals</h1>
          <p className="pg-sub">
            Reusable named menus Create Dinner picks from, assembled from your Dish Library.
          </p>
        </div>
        <Link href="/admin/dish-library" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
          Dish Library →
        </Link>
      </div>

      <NewMealButton restaurantId={restaurant.id} />

      <MealsList meals={meals} />
    </div>
  );
}
