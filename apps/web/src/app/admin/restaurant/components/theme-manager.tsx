"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";
import { toggleThemeForRestaurant } from "../theme-actions";

interface ThemeManagerProps {
  restaurantId: string;
  allThemes: Theme[];
  enabledThemeIds: string[];
}

/**
 * Rebuilt to the wireframe's literal pattern (§sec-restaurant-profile): one
 * nested .card.card-pad row per theme, name + "Enabled" badge inline,
 * description below, toggle on the right. No segmented all/on/off filter,
 * no numbered pager, no per-theme category icon - none of those exist in
 * the wireframe, so the earlier bulk "turn all on/off" action and filter
 * tabs that lived in the removed .tbar are gone too. Per-theme enable/
 * disable toggle logic and data wiring are unchanged.
 */
export function ThemeManager({ restaurantId, allThemes, enabledThemeIds }: ThemeManagerProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(enabledThemeIds));
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (themeId: string, currentlyEnabled: boolean) => {
    setLoading((prev) => new Set(prev).add(themeId));
    setError(null);

    const result = await toggleThemeForRestaurant(restaurantId, themeId, !currentlyEnabled);

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
      setError(result.error ?? "Something went wrong");
    }
  };

  return (
    <div>
      {error && (
        <div
          style={{
            marginBottom: 10, borderRadius: 12, border: "1px solid var(--red-bg)",
            background: "var(--red-bg)", padding: "10px 12px",
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {allThemes.map((theme) => {
          const isEnabled = enabled.has(theme.id);
          const isLoading = loading.has(theme.id);

          return (
            <div
              key={theme.id}
              className="card card-pad"
              style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{theme.title}</span>
                  {isEnabled && <span className="badge badge-green">Enabled</span>}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--t3)" }}>{theme.shortDescription}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={`${isEnabled ? "Disable" : "Enable"} ${theme.title}`}
                onClick={() => handleToggle(theme.id, isEnabled)}
                disabled={isLoading}
                className={`toggle ${isEnabled ? "on" : "off"}`}
                style={{ flexShrink: 0, opacity: isLoading ? 0.5 : 1 }}
              >
                <span className="toggle-dot" />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ borderRadius: 14, padding: "12px 16px", background: "var(--bg2)", border: "1px solid var(--bdr)", marginTop: 14 }}>
        <p style={{ fontSize: 12.5, color: "var(--t2)" }}>
          <strong style={{ color: "var(--text)" }}>Note:</strong> Enabled themes will be available
          when creating new dinners. Disabling a theme won&apos;t affect existing dinners.
        </p>
      </div>
    </div>
  );
}
