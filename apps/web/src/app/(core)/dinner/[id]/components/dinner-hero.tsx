"use client";

import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface DinnerHeroProps {
  photos: string[];
  theme: string;
  status: string;
}

export function DinnerHero({ photos, theme, status }: DinnerHeroProps) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActiveIndex(index);
  };

  return (
    <div className="relative h-60 overflow-hidden bg-[#2c1f15]">
      {photos.length > 0 ? (
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${url}-${index}`}
              src={url}
              alt={theme}
              className="h-full w-full flex-none snap-start object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#3d2b1f] via-[#5c3d28] to-[#3d2b1f]">
          <Users className="h-16 w-16 text-white/20" />
        </div>
      )}

      {/* Dot indicators + counter - only meaningful with more than one photo */}
      {photos.length > 1 && (
        <>
          <div className="absolute bottom-3 left-0 right-0 z-[2] flex justify-center gap-1.5">
            {photos.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full bg-white transition-all ${
                  index === activeIndex ? "w-4 opacity-100" : "w-1.5 opacity-50"
                }`}
              />
            ))}
          </div>
          <div
            className={`absolute right-3.5 z-[2] rounded-full bg-black/45 px-2.5 py-1 text-[10.5px] font-semibold text-white ${
              status === "LIVE" ? "top-14" : "top-3.5"
            }`}
          >
            {activeIndex + 1} / {photos.length}
          </div>
        </>
      )}

      {/* Fade into cream background */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-cream-100" />

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute left-4 top-4 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft transition-colors hover:bg-white"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4 text-gray-900" />
      </button>

      {/* Live badge */}
      {status === "LIVE" && (
        <div className="absolute right-4 top-4 z-[2]">
          <span className="rounded-full bg-green-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
