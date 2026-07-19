import { fetchDinners, type DiscoverFilters } from "../lib/fetch-dinners";
import { MapboxView } from "./mapbox-view";
import { StaticMapPlaceholder } from "./static-map-placeholder";

interface DiscoverMapProps {
  searchParams: DiscoverFilters;
}

export async function DiscoverMap({ searchParams }: DiscoverMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken) {
    return <StaticMapPlaceholder />;
  }

  const { dinners } = await fetchDinners(searchParams);

  return <MapboxView dinners={dinners} mapboxToken={mapboxToken} />;
}
