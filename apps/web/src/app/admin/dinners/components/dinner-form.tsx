"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDinner } from "../create-actions";
import { saveDinnerListingPhotos } from "../media-actions";

interface DinnerFormProps {
  restaurantId: string;
  restaurantName: string;
  enabledThemes: Array<{
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  }>;
  photoPool: Array<{ id: string; url: string }>;
  meals: Array<{ id: string; name: string; suggestedPricePerSeatCents: number }>;
}

export function DinnerForm({
  restaurantId,
  restaurantName,
  enabledThemes,
  photoPool,
  meals,
}: DinnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [showThemeDetails, setShowThemeDetails] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("");

  const handleMealChange = (mealId: string) => {
    setSelectedMealId(mealId);
    const meal = meals.find((m) => m.id === mealId);
    if (meal) {
      setPricePerSeat((meal.suggestedPricePerSeatCents / 100).toFixed(2));
    }
  };

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const startsAtDate = formData.get("startsAtDate") as string;
    const startsAtTime = formData.get("startsAtTime") as string;
    const endsAtTime = formData.get("endsAtTime") as string;

    // Combine date and time
    const startsAt = new Date(`${startsAtDate}T${startsAtTime}`);
    const endsAt = new Date(`${startsAtDate}T${endsAtTime}`);

    const priceCents = pricePerSeat ? Math.round(parseFloat(pricePerSeat) * 100) : undefined;

    const result = await createDinner({
      restaurantId,
      themeId: formData.get("themeId") as string,
      mealId: selectedMealId || undefined,
      pricePerSeatCents: priceCents !== undefined && !Number.isNaN(priceCents) ? priceCents : undefined,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      description: formData.get("description") as string || undefined,
      seatCount: parseInt(formData.get("seatCount") as string),
    });

    if (result.success) {
      if (selectedPhotoIds.length > 0) {
        await saveDinnerListingPhotos(result.data.dinnerId, selectedPhotoIds);
      }
      setLoading(false);
      router.push("/admin/dinners");
      router.refresh();
    } else {
      setLoading(false);
      setError(result.error);
    }
  };

  const selectedThemeData = enabledThemes.find((t) => t.id === selectedTheme);

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Restaurant Info */}
      <div className="bg-cream-100 border border-gray-100 rounded-2xl p-4">
        <p className="text-sm text-gray-600">
          Creating dinner for:{" "}
          <span className="font-medium text-gray-900">{restaurantName}</span>
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label
          htmlFor="themeId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Table Theme <span className="text-red-500">*</span>
        </label>
        {enabledThemes.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              No themes are enabled for your restaurant. Please enable at least
              one theme in your{" "}
              <Link
                href="/admin/restaurant"
                className="underline hover:text-amber-900"
              >
                restaurant settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <select
              id="themeId"
              name="themeId"
              required
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">Select a theme...</option>
              {enabledThemes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>

            {selectedThemeData && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowThemeDetails(!showThemeDetails)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {showThemeDetails ? "▾" : "▸"} View theme details
                </button>
                {showThemeDetails && (
                  <div className="mt-2 p-3 bg-cream-100 border border-gray-100 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedThemeData.shortDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Meal */}
      <div>
        <label htmlFor="mealId" className="block text-sm font-medium text-gray-700 mb-2">
          Meal
        </label>
        {meals.length === 0 ? (
          <div className="bg-cream-100 border border-gray-100 rounded-2xl p-4">
            <p className="text-sm text-gray-600">
              No Meals yet. Build one in{" "}
              <Link href="/admin/meals" className="underline hover:text-gray-900">
                Meals
              </Link>{" "}
              to show a real menu on this dinner&apos;s listing, or leave this blank.
            </p>
          </div>
        ) : (
          <select
            id="mealId"
            name="mealId"
            value={selectedMealId}
            onChange={(e) => handleMealChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            <option value="">No meal</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Price per Seat */}
      <div>
        <label htmlFor="pricePerSeat" className="block text-sm font-medium text-gray-700 mb-2">
          Price per Seat (ZAR)
        </label>
        <input
          type="number"
          id="pricePerSeat"
          name="pricePerSeat"
          min="0"
          step="0.01"
          value={pricePerSeat}
          onChange={(e) => setPricePerSeat(e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        <p className="text-sm text-gray-400 mt-1">
          Pre-fills from the selected Meal&apos;s suggested price — still editable per dinner.
        </p>
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="startsAtDate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="startsAtDate"
          name="startsAtDate"
          required
          min={minDate}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startsAtTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startsAtTime"
            name="startsAtTime"
            required
            defaultValue="19:00"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="endsAtTime"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endsAtTime"
            name="endsAtTime"
            required
            defaultValue="21:00"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Seat Count */}
      <div>
        <label
          htmlFor="seatCount"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Number of Seats <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="seatCount"
          name="seatCount"
          required
          min="2"
          max="20"
          defaultValue="6"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
        <p className="text-sm text-gray-400 mt-1">Between 2 and 20 seats</p>
      </div>

      {/* Description (Optional) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add any special notes about this dinner..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
        />
      </div>

      {/* Listing Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Listing Photos
        </label>
        {photoPool.length === 0 ? (
          <div className="bg-cream-100 border border-gray-100 rounded-2xl p-4">
            <p className="text-sm text-gray-600">
              No photos yet. Upload some to your{" "}
              <Link
                href="/admin/media-library"
                className="underline hover:text-gray-900"
              >
                Media Library
              </Link>{" "}
              first, then pick them here.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-2">
              Pick photos from your library. The first one you select becomes the header photo guests see on Discover.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoPool.map((photo) => {
                const selectedIndex = selectedPhotoIds.indexOf(photo.id);
                const isSelected = selectedIndex !== -1;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                      isSelected ? "border-primary-500" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    {isSelected && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                        {selectedIndex === 0 ? "★" : selectedIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-4 border-t border-gray-100 sm:flex-row">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-cream-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || enabledThemes.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 text-white bg-primary-500 rounded-full shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Dinner"}
        </button>
      </div>
    </form>
  );
}
