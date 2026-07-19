import Link from "next/link";
import { Users, Clock, MessageCircle, MapPin } from "lucide-react";
import type { DinnerListItem } from "@dinewithme/shared";
import { cn } from "@/lib/utils";

interface DinnerCardProps {
  dinner: DinnerListItem;
}

export function DinnerCard({ dinner }: DinnerCardProps) {
  const startsAt = new Date(dinner.startsAt);

  const timeStr = startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const spotsLeft = dinner.seats.available;
  const spotsText =
    spotsLeft === 0
      ? "Sold out"
      : `${spotsLeft} spots left • ${dinner.seats.total} total`;

  return (
    <Link href={`/dinner/${dinner.id}`} className="block">
      <div className="overflow-hidden rounded-2xl bg-white shadow-card transition-all active:scale-[0.98]">

        {/* Full-bleed hero image — no border-radius clip on top */}
        <div className="relative h-[200px] w-full overflow-hidden bg-cream-200">
          {dinner.restaurant.heroImageUrl ? (
            <img
              src={dinner.restaurant.heroImageUrl}
              alt={dinner.restaurant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
              <Users className="h-12 w-12 text-primary-300" />
            </div>
          )}
          {dinner.status === "LIVE" && (
            <span className="absolute left-3 top-3 rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white">
              LIVE
            </span>
          )}
        </div>

        {/* Card body */}
        <div className="px-4 pb-4 pt-3">
          {/* Restaurant name + city */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-bold leading-tight text-gray-900">
              {dinner.restaurant.name}
            </h3>
            {dinner.restaurant.city && (
              <div className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3" />
                <span>{dinner.restaurant.city}</span>
              </div>
            )}
          </div>

          {/* Info rows — matches wireframe exactly */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>{spotsText}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>{dinner.theme.shortDescription}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span>{timeStr}</span>
            </div>
          </div>

          {/* Attending avatars row */}
          {dinner.seats.confirmed > 0 && (
            <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
              <div className="flex">
                {Array.from({ length: Math.min(dinner.seats.confirmed, 3) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 border-white bg-primary-500",
                        i > 0 && "-ml-2"
                      )}
                    />
                  )
                )}
              </div>
              <span className="text-sm text-gray-500">
                {dinner.seats.confirmed}{" "}
                {dinner.seats.confirmed === 1 ? "person" : "people"} attending
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
