"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";
import { toggleThemeForRestaurant } from "../theme-actions";

interface ThemeManagerProps {
  restaurantId: string;
  allThemes: Theme[];
  enabledThemeIds: string[];
}

type Filter = "all" | "on" | "off";

// No icon field on Theme — map by keyword in the theme's key so real,
// non-mockup themes still get a sensible glyph instead of nothing.
function themeIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("deep")) return "ic-deeptalk";
  if (k.includes("network") || k.includes("business") || k.includes("professional")) return "ic-network";
  if (k.includes("creative")) return "ic-creative";
  if (k.includes("entrepreneur") || k.includes("founder")) return "ic-founder";
  if (k.includes("family") || k.includes("women")) return "ic-family";
  if (k.includes("date")) return "ic-date";
  if (k.includes("tech")) return "ic-tech";
  if (k.includes("wellness")) return "ic-wellness";
  return "ic-general";
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
  const [filter, setFilter] = useState<Filter>("all");
  const [bulkPending, setBulkPending] = useState(false);

  const onCount = allThemes.filter((t) => enabled.has(t.id)).length;
  const offCount = allThemes.length - onCount;
  const visibleThemes = allThemes.filter((t) => {
    if (filter === "on") return enabled.has(t.id);
    if (filter === "off") return !enabled.has(t.id);
    return true;
  });

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

  const handleTurnAll = async () => {
    const turningOn = onCount !== allThemes.length;
    const targets = allThemes.filter((t) => enabled.has(t.id) !== turningOn);
    if (targets.length === 0) return;

    setBulkPending(true);
    setError(null);
    const results = await Promise.all(
      targets.map((t) => toggleThemeForRestaurant(restaurantId, t.id, turningOn))
    );
    setBulkPending(false);

    const succeeded = targets.filter((_, i) => results[i]?.success);
    if (succeeded.length > 0) {
      setEnabled((prev) => {
        const next = new Set(prev);
        succeeded.forEach((t) => (turningOn ? next.add(t.id) : next.delete(t.id)));
        return next;
      });
    }
    const failed = results.find((r) => !r.success);
    if (failed && !failed.success) setError(failed.error);
  };

  return (
    <div>
      <div className="tbar">
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")}>
            All {allThemes.length}
          </button>
          <button role="tab" aria-selected={filter === "on"} onClick={() => setFilter("on")}>
            Hosting {onCount}
          </button>
          <button role="tab" aria-selected={filter === "off"} onClick={() => setFilter("off")}>
            Off {offCount}
          </button>
        </div>
        <button type="button" className="linkbtn" onClick={handleTurnAll} disabled={bulkPending}>
          {onCount === allThemes.length ? "Turn all off" : "Turn all on"}
        </button>
      </div>

      {error && (
        <div style={{ margin: 14, borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "10px 12px" }}>
          <p style={{ fontSize: 12.5, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      <div className="tgrid">
        {visibleThemes.map((theme) => {
          const isEnabled = enabled.has(theme.id);
          const isLoading = loading.has(theme.id);

          return (
            <div key={theme.id} className={`trow ${isEnabled ? "on" : ""}`}>
              <span className="ticon"><svg><use href={`#${themeIcon(theme.key)}`} /></svg></span>
              <div className="tmeta">
                <div className="tname">{theme.title}</div>
                <div className="tdesc">{theme.shortDescription}</div>
              </div>
              <button
                onClick={() => handleToggle(theme.id, isEnabled)}
                disabled={isLoading || bulkPending}
                className="sw"
                style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                role="switch"
                aria-checked={isEnabled}
                aria-label={`${isEnabled ? "Disable" : "Enable"} ${theme.title}`}
              >
                <span className="sw-dot" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
