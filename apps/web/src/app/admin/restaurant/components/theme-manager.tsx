"use client";

import { useState } from "react";
import type { Theme } from "@prisma/client";
import { toggleThemeForRestaurant } from "../theme-actions";

interface ThemeManagerProps {
  restaurantId: string;
  allThemes: Theme[];
  enabledThemeIds: string[];
}

const PAGE_SIZE = 6;

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
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(allThemes.length / PAGE_SIZE));
  const visibleThemes = allThemes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <div>
      {error && (
        <div
          style={{
            marginBottom: 12,
            borderRadius: 12,
            border: "1px solid var(--red-bg)",
            background: "var(--red-bg)",
            padding: "10px 12px",
          }}
        >
          <p style={{ fontSize: 12.5, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      <div className="theme-grid">
        {visibleThemes.map((theme) => {
          const isEnabled = enabled.has(theme.id);
          const isLoading = loading.has(theme.id);

          return (
            <div key={theme.id} className="theme-tile" title={theme.shortDescription}>
              <div className="theme-tile-body">
                <div className="theme-tile-name">{theme.title}</div>
                <div className="theme-tile-desc">{theme.shortDescription}</div>
              </div>

              <button
                onClick={() => handleToggle(theme.id, isEnabled)}
                disabled={isLoading}
                className={`toggle ${isEnabled ? "on" : "off"}`}
                style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                role="switch"
                aria-checked={isEnabled}
                aria-label={`${isEnabled ? "Disable" : "Enable"} ${theme.title}`}
              >
                <div className="toggle-dot" />
              </button>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pager">
          <button
            type="button"
            className="pager-btn pager-arrow"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`pager-btn ${n === page ? "active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="pager-btn pager-arrow"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
