import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  dinnerRepository,
  restaurantRepository,
  themeRepository,
  restaurantGalleryItemRepository,
  mealRepository,
  dinnerMediaRepository,
} from "@dinewithme/db";
import { getAuthUser } from "@/lib/auth/server";
import { DinnerForm, type MealDishPreview } from "../../components/dinner-form";
import { mealCoursesToDishPreview } from "../../meal-preview";

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function EditDinnerPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const dinner = await dinnerRepository.findByIdWithDetails(params.id);
  if (!dinner) {
    notFound();
  }

  const isOwner = await restaurantRepository.isUserOwner(dinner.restaurant.id, user.id);
  if (!isOwner) {
    redirect("/admin/dinners");
  }

  if (dinner.status !== "DRAFT") {
    // Only a DRAFT dinner's content is editable - once published its
    // content locks for good, a guest may already be looking at it.
    redirect(`/admin/dinners/${dinner.id}`);
  }

  const restaurant = await restaurantRepository.findById(dinner.restaurant.id);
  if (!restaurant) {
    notFound();
  }

  const [enabledThemes, galleryItems, meals, listingPhotos] = await Promise.all([
    themeRepository.findByRestaurant(restaurant.id),
    restaurantGalleryItemRepository.findByRestaurant(restaurant.id),
    mealRepository.findByRestaurantWithCourses(restaurant.id),
    dinnerMediaRepository.findByDinner(dinner.id, "DINNER_LISTING"),
  ]);

  const bookedSeatCount = dinner.seats.filter((seat) =>
    ["CONFIRMED", "ATTENDED", "COMPLETED"].includes(seat.status)
  ).length;

  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);

  return (
    <div className="din">
      <p className="pg-sub only-desktop" style={{ marginBottom: 12 }}>
        <Link href={`/admin/dinners/${dinner.id}`} style={{ color: "var(--p)", fontWeight: 600 }}>
          ← {dinner.theme?.title || "Dinner"}
        </Link>{" "}
        / Edit Dinner
      </p>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Link href={`/admin/dinners/${dinner.id}`} className="m-icon-btn" aria-label="Back to Dinner">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
          Edit Dinner
        </h1>
        <div style={{ width: 44 }} />
      </div>
      <div className="only-desktop" style={{ marginBottom: 20 }}>
        <h1 className="pg-title">Edit Dinner</h1>
        <p className="pg-sub">
          {dinner.theme?.title || "Dinner"} · {startsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {bookedSeatCount > 0 ? ` · ${bookedSeatCount} of ${dinner.seatCount} seats already booked` : ""}
        </p>
      </div>

      <DinnerForm
        mode="edit"
        dinnerId={dinner.id}
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
        meals={meals
          .filter((m) => m.isActive || m.id === dinner.meal?.id)
          .map((m) => ({
            id: m.id,
            name: m.name,
            suggestedPricePerSeatCents: m.suggestedPricePerSeatCents,
            dishes: mealCoursesToDishPreview(m.courses) as MealDishPreview[],
          }))}
        initialValues={{
          themeId: dinner.theme?.id ?? "",
          mealId: dinner.meal?.id ?? null,
          startsAtDate: toDateInputValue(startsAt),
          startsAtTime: toTimeInputValue(startsAt),
          endsAtTime: toTimeInputValue(endsAt),
          seatCount: dinner.seatCount,
          pricePerSeatCents: dinner.pricePerSeatCents,
          description: dinner.description,
          conversationStyle: dinner.conversationStyle,
          listingPhotoIds: listingPhotos.map((item) => item.mediaAsset.id),
          bookedSeatCount,
        }}
      />
    </div>
  );
}
