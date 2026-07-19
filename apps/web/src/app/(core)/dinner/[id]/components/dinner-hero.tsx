"use client";

import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface DinnerHeroProps {
  heroImageUrl: string | null;
  theme: string;
  status: string;
}

export function DinnerHero({ heroImageUrl, theme, status }: DinnerHeroProps) {
  const router = useRouter();

  return (
    <div className="relative h-60 overflow-hidden bg-[#2c1f15]">
      {/* Image or placeholder */}
      {heroImageUrl ? (
        <img
          src={heroImageUrl}
          alt={theme}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#3d2b1f] via-[#5c3d28] to-[#3d2b1f]">
          <Users className="h-16 w-16 text-white/20" />
        </div>
      )}

      {/* Fade into cream background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-cream-100" />

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition-colors hover:bg-white"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4 text-gray-900" />
      </button>

      {/* Live badge */}
      {status === "LIVE" && (
        <div className="absolute right-4 top-4">
          <span className="rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
