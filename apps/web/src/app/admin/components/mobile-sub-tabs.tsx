"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPathActive } from "../lib/nav-active";

interface MobileSubTabsProps {
  tabs: { label: string; href: string }[];
  /** Omit when the parent already spaces its children via flex `gap`. */
  marginBottom?: number;
}

/**
 * Mobile-only sub-tab pill row for the 3 merged bottom-nav groups (Dish,
 * Dinners, Profile) - lets each grouped page keep its own identity/content
 * while giving mobile users a way to switch to its sibling pages without
 * going back through the bottom nav.
 */
export function MobileSubTabs({ tabs, marginBottom }: MobileSubTabsProps) {
  const pathname = usePathname();

  return (
    <div className="tabs only-mobile" style={marginBottom ? { marginBottom } : undefined}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn("tab", isPathActive(pathname, [tab.href]) && "active")}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
