import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { mealRepository, menuItemRepository, restaurantRepository } from "@dinewithme/db";
import { MealEditor } from "./components/meal-editor";

export default async function MealEditorPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const meal = await mealRepository.findByIdWithCourses(params.id);
  if (!meal) {
    notFound();
  }

  const isOwner = await restaurantRepository.isUserOwner(meal.restaurantId, user.id);
  if (!isOwner) {
    notFound();
  }

  const dishLibrary = await menuItemRepository.findByRestaurant(meal.restaurantId);

  return (
    <div className="meals mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/admin/meals" className="m-icon-btn" aria-label="Back to Meals">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title">{meal.name}</h1>
      </div>

      <MealEditor meal={meal} dishLibrary={dishLibrary} />
    </div>
  );
}
