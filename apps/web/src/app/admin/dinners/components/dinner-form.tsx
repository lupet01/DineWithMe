"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDinner } from "../create-actions";

interface DinnerFormProps {
  restaurantId: string;
  restaurantName: string;
  enabledThemes: Array<{
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  }>;
}

export function DinnerForm({
  restaurantId,
  restaurantName,
  enabledThemes,
}: DinnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [showThemeDetails, setShowThemeDetails] = useState(false);

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

    const result = await createDinner({
      restaurantId,
      themeId: formData.get("themeId") as string,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      description: formData.get("description") as string || undefined,
      seatCount: parseInt(formData.get("seatCount") as string),
    });

    setLoading(false);

    if (result.success) {
      router.push("/admin/dinners");
      router.refresh();
    } else {
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
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          Creating dinner for:{" "}
          <span className="font-medium text-slate-900">{restaurantName}</span>
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label
          htmlFor="themeId"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Table Theme <span className="text-red-500">*</span>
        </label>
        {enabledThemes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No themes are enabled for your restaurant. Please enable at least
              one theme in your{" "}
              <Link
                href="/admin/restaurant"
                className="underline hover:text-yellow-900"
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
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {showThemeDetails ? "▾" : "▸"} View theme details
                </button>
                {showThemeDetails && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-sm text-slate-700">
                      {selectedThemeData.shortDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="startsAtDate"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="startsAtDate"
          name="startsAtDate"
          required
          min={minDate}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
        />
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startsAtTime"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startsAtTime"
            name="startsAtTime"
            required
            defaultValue="19:00"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="endsAtTime"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endsAtTime"
            name="endsAtTime"
            required
            defaultValue="21:00"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Seat Count */}
      <div>
        <label
          htmlFor="seatCount"
          className="block text-sm font-medium text-slate-700 mb-2"
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
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
        />
        <p className="text-sm text-slate-500 mt-1">Between 2 and 20 seats</p>
      </div>

      {/* Description (Optional) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add any special notes about this dinner..."
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-4 border-t border-slate-200 sm:flex-row">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || enabledThemes.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Dinner"}
        </button>
      </div>
    </form>
  );
}
