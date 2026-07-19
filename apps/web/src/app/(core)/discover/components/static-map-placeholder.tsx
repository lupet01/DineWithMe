/**
 * Fallback for when NEXT_PUBLIC_MAPBOX_TOKEN isn't configured - the
 * original static mock so the map view still renders something coherent
 * rather than an empty/broken screen.
 */
export function StaticMapPlaceholder() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
          stroke="#FF6B4A" strokeWidth="1.5" fill="#FFE8E1"
        />
        <circle cx="12" cy="10" r="3" fill="#FF6B4A" />
      </svg>
      <p className="text-sm font-medium text-gray-500">Map view</p>
      <p className="text-xs text-gray-400">Add NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map</p>
    </div>
  );
}
