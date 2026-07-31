import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { dinnerRepository, menuItemRepository, mediaAssetRepository } from "@dinewithme/db";
import { MenuCourse, DietaryTag } from "@prisma/client";

interface DishDetailPageProps {
  params: {
    id: string;
    menuItemId: string;
  };
}

const COURSE_LABELS: Record<MenuCourse, string> = {
  [MenuCourse.STARTER]: "Starter",
  [MenuCourse.MAIN]: "Main",
  [MenuCourse.DESSERT]: "Dessert",
};

const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  VEGETARIAN: "Vegetarian",
  VEGAN: "Vegan",
  PESCATARIAN: "Pescatarian",
  GLUTEN_FREE: "Gluten-Free",
  DAIRY_FREE: "Dairy-Free",
  NUT_FREE: "Nut-Free",
  HALAL: "Halal",
  KOSHER: "Kosher",
  CONTAINS_SHELLFISH: "Contains Shellfish",
  SPICY: "Spicy",
};

export default async function DishDetailPage({ params }: DishDetailPageProps) {
  const dinner = await dinnerRepository.findByIdWithRestaurant(params.id);
  if (!dinner) {
    notFound();
  }

  const dish = await menuItemRepository.findById(params.menuItemId);
  if (!dish || dish.restaurantId !== dinner.restaurant.id) {
    notFound();
  }

  const mediaAsset = dish.mediaAssetId ? await mediaAssetRepository.findById(dish.mediaAssetId) : null;

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      <div className="relative h-56 overflow-hidden bg-[#2c1f15]">
        {mediaAsset ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaAsset.url} alt={dish.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#3d2b1f] via-[#5c3d28] to-[#3d2b1f]">
            <Users className="h-16 w-16 text-white/20" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-cream-100" />
        <Link
          href={`/dinner/${params.id}/menu`}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition-colors hover:bg-white"
          aria-label="Back to Full Menu"
        >
          <ArrowLeft className="h-4 w-4 text-gray-900" />
        </Link>
      </div>

      <div className="mx-auto max-w-lg px-4">
        <div className="pt-4 pb-1">
          <h1 className="text-[22px] font-bold leading-tight text-gray-900">{dish.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{COURSE_LABELS[dish.course]}</p>
        </div>

        {dish.description && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <p className="text-sm leading-relaxed text-gray-600">{dish.description}</p>
          </div>
        )}

        {dish.ingredients && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">Ingredients</h2>
            <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600">{dish.ingredients}</p>
          </div>
        )}

        {dish.dietaryTags.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
            <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">Dietary</h2>
            <div className="flex flex-wrap gap-1.5 px-4 pb-4">
              {dish.dietaryTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600"
                >
                  {DIETARY_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
