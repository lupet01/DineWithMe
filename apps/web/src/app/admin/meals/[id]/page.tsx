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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/meals"
          className="rounded-lg p-2 transition-colors hover:bg-cream-200"
          aria-label="Back to Meals"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">{meal.name}</h1>
      </div>

      <MealEditor meal={meal} dishLibrary={dishLibrary} />
    </div>
  );
}
