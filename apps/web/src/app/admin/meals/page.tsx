import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, mealRepository } from "@dinewithme/db";
import { NewMealButton } from "./components/new-meal-button";
import { MealsList } from "./components/meals-list";
import { MobileSubTabs } from "../components/mobile-sub-tabs";

const dishTabs = [
  { label: "Meals", href: "/admin/meals" },
  { label: "Dish Library", href: "/admin/dish-library" },
];

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

  const meals = await mealRepository.findByRestaurantWithCourses(restaurant.id);

  return (
    <div className="meals mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <MobileSubTabs tabs={dishTabs} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="pg-title">Meals</h1>
          <p className="pg-sub">Reusable menus, chosen by name at Create Dinner</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/admin/dish-library" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
            Dish Library →
          </Link>
          <NewMealButton restaurantId={restaurant.id} />
        </div>
      </div>

      <MealsList meals={meals} restaurantId={restaurant.id} />
    </div>
  );
}
