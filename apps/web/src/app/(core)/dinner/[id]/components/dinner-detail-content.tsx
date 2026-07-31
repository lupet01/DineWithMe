import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, seatRepository, dinnerMediaRepository } from "@dinewithme/db";
import { getCurrentUser } from "@/lib/auth";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import type { DinnerDetail, ThemeDetail } from "@dinewithme/shared";
import { DinnerHero } from "./dinner-hero";
import { DinnerBookingPanel } from "./dinner-booking-panel";

interface DinnerDetailContentProps {
  dinnerId: string;
}

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  cuisine: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  heroImageUrl: string | null;
}

async function fetchDinnerDetail(dinnerId: string): Promise<DinnerDetail | null> {
  try {
    // Fetch dinner directly from database
    const dinner = await dinnerRepository.findByIdWithDetails(dinnerId);

    if (!dinner || !dinner.theme) {
      return null;
    }

    // Calculate seat counts
    const availableCount = dinner.seats.filter((s) => s.status === "AVAILABLE").length;
    const confirmedCount = dinner.seats.filter((s) => s.status === "CONFIRMED").length;
    const heldCount = dinner.seats.filter((s) => s.status === "HELD").length;

    const restaurant = dinner.restaurant as Restaurant;
    const theme = dinner.theme as ThemeDetail;

    const listingPhotos = await dinnerMediaRepository.findByDinner(dinner.id, "DINNER_LISTING");
    const photos = listingPhotos.length > 0
      ? listingPhotos.map((item) => item.mediaAsset.url)
      : restaurant.heroImageUrl
        ? [restaurant.heroImageUrl]
        : [];

    // Transform to expected format
    return {
      id: dinner.id,
      theme,
      description: dinner.description,
      startsAt: dinner.startsAt.toISOString(),
      endsAt: dinner.endsAt.toISOString(),
      seatCount: dinner.seatCount,
      status: dinner.status,
      pricePerSeatCents: dinner.pricePerSeatCents,
      createdAt: dinner.createdAt.toISOString(),
      updatedAt: dinner.updatedAt.toISOString(),
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        city: restaurant.city,
        address: restaurant.address,
        phone: restaurant.phone,
        website: restaurant.website,
        heroImageUrl: restaurant.heroImageUrl,
      },
      seats: {
        total: dinner._count.seats,
        available: availableCount,
        confirmed: confirmedCount,
        held: heldCount,
        attended: 0,
      },
      photos,
    };
  } catch (error) {
    console.error("Error fetching dinner detail:", error);
    return null;
  }
}

export async function DinnerDetailContent({
  dinnerId,
}: DinnerDetailContentProps) {
  const { userId } = await auth();
  const dinner = await fetchDinnerDetail(dinnerId);

  if (!dinner) {
    notFound();
  }

  // Check if current user already has a seat for this dinner
  let userHasSeat = false;
  if (userId) {
    const dbUser = await getCurrentUser();
    if (dbUser) {
      const userSeats = await seatRepository.findByDinnerAndUser(dinnerId, dbUser.id);
      userHasSeat = userSeats.some(
        (s) => s.status === "HELD" || s.status === "CONFIRMED" || s.status === "ATTENDED"
      );
    }
  }

  // Track analytics
  if (userId) {
    await track(AnalyticsEvents.DINNER_DETAIL_VIEWED, {
      userId,
      dinnerId: dinner.id,
      restaurantId: dinner.restaurant.id,
      theme: dinner.theme.title,
      seatsAvailable: dinner.seats.available,
      timestamp: new Date().toISOString(),
    });
  }

  const hasSeatsAvailable = dinner.seats.available > 0;

  return (
    <div className="min-h-screen bg-cream-100 pb-36">
      {/* Hero — fades into cream background */}
      <DinnerHero
        photos={dinner.photos ?? []}
        theme={dinner.theme.title}
        status={dinner.status}
      />

      {/* Content + sticky CTA — shares dietary-notes state via a client wrapper */}
      <DinnerBookingPanel
        dinner={dinner}
        userHasSeat={userHasSeat}
        hasSeatsAvailable={hasSeatsAvailable}
        seatsAvailable={dinner.seats.available}
      />
    </div>
  );
}
