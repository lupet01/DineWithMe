"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";
import { toggleThemeForRestaurant } from "../theme-actions";

interface ThemeManagerProps {
  restaurantId: string;
  allThemes: Theme[];
  enabledThemeIds: string[];
}

export function ThemeManager({
  restaurantId,
  allThemes,
  enabledThemeIds,
}: ThemeManagerProps) {
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(enabledThemeIds)
  );
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (themeId: string, currentlyEnabled: boolean) => {
    setLoading((prev) => new Set(prev).add(themeId));
    setError(null);

    const result = await toggleThemeForRestaurant(
      restaurantId,
      themeId,
      !currentlyEnabled
    );

    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(themeId);
      return next;
    });

    if (result.success) {
      setEnabled((prev) => {
        const next = new Set(prev);
        if (currentlyEnabled) {
          next.delete(themeId);
        } else {
          next.add(themeId);
        }
        return next;
      });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {allThemes.map((theme) => {
          const isEnabled = enabled.has(theme.id);
          const isLoading = loading.has(theme.id);

          return (
            <div
              key={theme.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900">
                      {theme.title}
                    </h3>
                    {isEnabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Enabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {theme.shortDescription}
                  </p>
                  <details className="text-sm text-slate-600">
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                      View details
                    </summary>
                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-slate-200">
                      <div>
                        <p className="font-medium text-slate-700">
                          What to Expect:
                        </p>
                        <p className="text-slate-600">{theme.whatToExpect}</p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">
                          Boundaries:
                        </p>
                        <p className="text-slate-600">{theme.boundaries}</p>
                      </div>
                    </div>
                  </details>
                </div>

                <button
                  onClick={() => handleToggle(theme.id, isEnabled)}
                  disabled={isLoading}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                    ${isEnabled ? "bg-green-600" : "bg-slate-200"}
                    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={`${isEnabled ? "Disable" : "Enable"} ${theme.title}`}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${isEnabled ? "translate-x-5" : "translate-x-0"}
                    `}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <span className="font-medium text-slate-700">Note:</span> Enabled
          themes will be available when creating new dinners. Disabling a theme
          won&apos;t affect existing dinners.
        </p>
      </div>
    </div>
  );
}
