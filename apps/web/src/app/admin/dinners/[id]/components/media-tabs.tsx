"use client";

import { useState } from "react";

interface MediaTabsProps {
  listingPanel: React.ReactNode;
  tablePanel: React.ReactNode;
}

/**
 * Media tab's two jobs (§16.4 wireframe): curating Listing Photos (public,
 * restaurant's own shots) vs. Table Photos (private by default, may show
 * real guests, "Promote" sends one through moderation). Two sub-tabs
 * within the Dinner Detail's own Media tab.
 */
export function MediaTabs({ listingPanel, tablePanel }: MediaTabsProps) {
  const [tab, setTab] = useState<"listing" | "table">("listing");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="tabs">
        <button type="button" className={`tab ${tab === "listing" ? "active" : ""}`} onClick={() => setTab("listing")}>
          Listing Photos
        </button>
        <button type="button" className={`tab ${tab === "table" ? "active" : ""}`} onClick={() => setTab("table")}>
          Table Photos
        </button>
      </div>
      {tab === "listing" ? listingPanel : tablePanel}
    </div>
  );
}
