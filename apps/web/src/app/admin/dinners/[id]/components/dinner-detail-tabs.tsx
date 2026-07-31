"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";

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
    <div className="space-y-6">
      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
      {tab === "details" && detailsPanel}
      {tab === "guests" && guestsPanel}
      {tab === "media" && mediaPanel}
    </div>
  );
}
