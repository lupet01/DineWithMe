"use client";

import { useState } from "react";

interface DinnerDetailTabsProps {
  detailsPanel: React.ReactNode;
  guestsPanel: React.ReactNode;
  mediaPanel: React.ReactNode;
}

const TAB_ITEMS = [
  { value: "details", label: "Details" },
  { value: "guests", label: "Guests" },
  { value: "media", label: "Media" },
];

/**
 * Real 3-tab structure (§16.1 wireframe) - Details previously didn't exist
 * as its own screen anywhere, and Media had no tab bar pointing to it at
 * all despite its own header claiming one existed. Guests stays the
 * default tab - the stats and guest table are one cohesive unit, since the
 * stats are literally counts derived from the guest rows.
 */
export function DinnerDetailTabs({ detailsPanel, guestsPanel, mediaPanel }: DinnerDetailTabsProps) {
  const [tab, setTab] = useState("guests");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="tabs">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`tab ${tab === item.value ? "active" : ""}`}
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "details" && detailsPanel}
      {tab === "guests" && guestsPanel}
      {tab === "media" && mediaPanel}
    </div>
  );
}
