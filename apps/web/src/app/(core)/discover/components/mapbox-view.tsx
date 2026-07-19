"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Users, MapPin } from "lucide-react";
import type { DinnerListItem } from "@dinewithme/shared";

interface MapboxViewProps {
  dinners: DinnerListItem[];
  mapboxToken: string;
}

// Cape Town - fallback map center when no dinner has restaurant coordinates yet.
const FALLBACK_CENTER = { latitude: -33.9249, longitude: 18.4241 };

export function MapboxView({ dinners, mapboxToken }: MapboxViewProps) {
  const pins = useMemo(
    () =>
      dinners.filter(
        (d): d is DinnerListItem & { restaurant: { latitude: number; longitude: number } } =>
          d.restaurant.latitude != null && d.restaurant.longitude != null
      ),
    [dinners]
  );

  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null);
  const selected = pins.find((d) => d.id === selectedId) ?? null;

  const center = pins[0]
    ? { latitude: pins[0].restaurant.latitude, longitude: pins[0].restaurant.longitude }
    : FALLBACK_CENTER;

  return (
    <div className="relative h-full min-h-[50vh] w-full">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{ ...center, zoom: 12 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: "100%", height: "100%" }}
      >
        {pins.map((dinner) => (
          <Marker
            key={dinner.id}
            latitude={dinner.restaurant.latitude}
            longitude={dinner.restaurant.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedId(dinner.id);
            }}
          >
            <button
              type="button"
              aria-label={`View ${dinner.restaurant.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary-500 shadow-card transition-transform active:scale-95"
            >
              <MapPin className="h-4 w-4 text-white" fill="white" />
            </button>
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.restaurant.latitude}
            longitude={selected.restaurant.longitude}
            onClose={() => setSelectedId(null)}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            offset={16}
          >
            <span className="text-xs font-semibold text-gray-900">
              {selected.restaurant.name}
            </span>
          </Popup>
        )}
      </Map>

      {/* Floating restaurant card for the selected pin */}
      {selected && (
        <Link
          href={`/dinner/${selected.id}`}
          className="absolute bottom-4 left-3 right-3 block overflow-hidden rounded-2xl bg-white shadow-card"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-cream-300">
              {selected.restaurant.heroImageUrl && (
                <img
                  src={selected.restaurant.heroImageUrl}
                  alt={selected.restaurant.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold text-gray-900">
                {selected.restaurant.name}
              </p>
              <p className="text-xs text-gray-500">
                {selected.seats.available === 0
                  ? "Sold out"
                  : `${selected.seats.available} spots left · ${selected.seats.total} total`}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              {selected.seats.confirmed}
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
