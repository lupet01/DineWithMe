import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { mealRepository, menuItemRepository, mediaAssetRepository, restaurantRepository } from "@dinewithme/db";
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

  const [dishLibrary, photoAssets] = await Promise.all([
    menuItemRepository.findByRestaurant(meal.restaurantId),
    mediaAssetRepository.findByRestaurant(meal.restaurantId),
  ]);

  return (
    <div className="meals mx-auto max-w-3xl" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <MealEditor
        meal={meal}
        dishLibrary={dishLibrary}
        photoPool={photoAssets.map((asset) => ({ id: asset.id, url: asset.url }))}
      />
    </div>
  );
}
