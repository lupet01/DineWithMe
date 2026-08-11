import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, feedbackRepository } from "@dinewithme/db";
import { ReviewFilters } from "./components/review-filters";
import { ReviewRow } from "./components/review-row";

function initials(firstName: string | null, lastName: string | null, email: string): string {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  const combined = `${first}${last}`.toUpperCase();
  return combined || email[0]?.toUpperCase() || "?";
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: { rating?: string; dinner?: string };
}) {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  if (!restaurant) {
    return (
      <div>
        <h1 className="pg-title" style={{ marginBottom: 16 }}>
          Guest Feedback
        </h1>
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
          Set up your restaurant profile first to see guest feedback here.
        </div>
      </div>
    );
  }

  const [allReviews, avgRating] = await Promise.all([
    feedbackRepository.findRatedForRestaurant(restaurant.id),
    feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
  ]);

  const dinners = Array.from(
    new Map(allReviews.map((r) => [r.dinner.id, { id: r.dinner.id, title: r.dinner.theme?.title ?? "Dinner" }])).values()
  );

  const ratingFilter = searchParams.rating ?? "all";
  const dinnerFilter = searchParams.dinner ?? "all";

  const reviews = allReviews.filter((r) => {
    if (dinnerFilter !== "all" && r.dinner.id !== dinnerFilter) return false;
    if (ratingFilter === "all" || r.rating === null) return ratingFilter === "all";
    if (ratingFilter === "3-") return r.rating <= 3;
    return r.rating === Number(ratingFilter);
  });

  return (
    <div className="reviews">
      <p className="pg-sub only-desktop" style={{ marginBottom: 12 }}>
        <Link href="/admin" style={{ color: "var(--p)", fontWeight: 600 }}>
          ← Dashboard
        </Link>{" "}
        / Guest Feedback
      </p>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
        <Link href="/admin" className="m-icon-btn" aria-label="Back to Dashboard">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
          Guest Feedback
        </h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div className="only-desktop">
          <h1 className="pg-title">Guest Feedback</h1>
          <p className="pg-sub">
            {avgRating ? `${avgRating.average.toFixed(1)} ★ average · ${avgRating.count} reviews all-time` : "No ratings yet"}
          </p>
        </div>
        <p className="pg-sub only-mobile" style={{ margin: 0 }}>
          {avgRating ? `${avgRating.average.toFixed(1)} ★ avg · ${avgRating.count} reviews all-time` : "No ratings yet"}
        </p>
        <ReviewFilters currentRating={ratingFilter} currentDinner={dinnerFilter} dinners={dinners} />
      </div>

      {reviews.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
          {allReviews.length === 0 ? "No reviews yet." : "No reviews match these filters."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {reviews.map((review) => (
            <ReviewRow
              key={review.id}
              feedbackId={review.id}
              authorName={[review.author.firstName, review.author.lastName].filter(Boolean).join(" ") || review.author.email}
              authorInitials={initials(review.author.firstName, review.author.lastName, review.author.email)}
              dinnerId={review.dinner.id}
              dinnerTitle={review.dinner.theme?.title ?? "Dinner"}
              dinnerDate={new Date(review.dinner.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              rating={review.rating ?? 0}
              notes={review.notes}
              restaurantNote={review.restaurantNote}
              vibeTags={review.vibeTags}
            />
          ))}
        </div>
      )}
    </div>
  );
}
