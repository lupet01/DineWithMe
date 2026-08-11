"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, Calendar, FileText, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPathActive } from "../lib/nav-active";

const tabs = [
  { name: "Home", href: "/admin", matches: ["/admin", "/admin/analytics", "/admin/reviews"], icon: LayoutDashboard },
  { name: "Dish", href: "/admin/meals", matches: ["/admin/meals", "/admin/dish-library"], icon: Utensils },
  { name: "Dinners", href: "/admin/dinners", matches: ["/admin/dinners", "/admin/guests"], icon: Calendar },
  { name: "Payouts", href: "/admin/payouts", matches: ["/admin/payouts"], icon: FileText },
  { name: "Profile", href: "/admin/restaurant", matches: ["/admin/restaurant", "/admin/team", "/admin/media-library", "/admin/settings"], icon: Store },
];

interface AdminBottomNavProps {
  isOnboarding?: boolean;
}

export function AdminBottomNav({ isOnboarding }: AdminBottomNavProps) {
  const pathname = usePathname();

  // /admin/ops/* is nested under the same AdminShell but is a separate
  // portal (Platform Ops) with its own routes - none of these restaurant-
  // scoped tabs apply there, so the bar would show with nothing active and
  // every tap would jump the platform admin out of Ops entirely.
  if (isOnboarding || pathname?.startsWith("/admin/ops")) return null;

  return (
    <nav className="d-bottom-nav only-mobile-flex">
      {tabs.map((tab) => {
        const isActive = isPathActive(pathname, tab.matches);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn("d-bottom-nav-item", isActive && "active")}
          >
            <Icon />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
