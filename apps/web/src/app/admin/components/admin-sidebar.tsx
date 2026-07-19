"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Calendar,
  ClipboardList,
  Shield,
  Building2,
  BarChart3,
  Sparkles,
  Target,
  Users,
  Flag,
  CreditCard,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@dinewithme/shared";

const restaurantNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Restaurant Profile", href: "/admin/restaurant", icon: Store },
  { name: "Dinners", href: "/admin/dinners", icon: Calendar },
  { name: "Guests & Bookings", href: "/admin/guests", icon: ClipboardList },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
];

const platformOpsNav = [
  { name: "Cockpit", href: "/admin/ops", icon: Shield },
  { name: "Restaurants", href: "/admin/ops/restaurants", icon: Building2 },
  { name: "Analytics", href: "/admin/ops/analytics", icon: BarChart3 },
  { name: "Themes", href: "/admin/ops/themes", icon: Sparkles },
  { name: "Theme Performance", href: "/admin/ops/themes/performance", icon: Target },
  { name: "Users", href: "/admin/ops/users", icon: Users },
  { name: "Trust & Safety", href: "/admin/ops/trust-safety", icon: Flag },
  { name: "Billing", href: "/admin/ops/billing", icon: CreditCard },
];

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface AdminSidebarProps {
  userRole: Role;
  isOpen?: boolean;
  onClose?: () => void;
}

function isItemActive(pathname: string | null, href: string) {
  return (
    pathname === href ||
    (href !== "/admin" && href !== "/admin/ops" && pathname?.startsWith(href + "/"))
  );
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {title}
        </div>
      ) : null}
      {items.map((item) => {
        const isActive = isItemActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-white font-semibold text-gray-900 shadow-card"
                : "text-gray-600 hover:bg-white/60"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

function NavLinks({
  userRole,
  pathname,
  onNavigate,
}: {
  userRole: Role;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <NavSection items={restaurantNav} pathname={pathname} onNavigate={onNavigate} />
      {userRole === Role.PLATFORM_ADMIN ? (
        <NavSection
          title="Platform Ops"
          items={platformOpsNav}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ) : null}
    </>
  );
}

export function AdminSidebar({ userRole, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 bg-cream-200 border-r border-gray-100 min-h-[calc(100vh-4rem)]">
        <nav className="p-4 space-y-1">
          <NavLinks userRole={userRole} pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[80%] bg-cream-100 shadow-xl flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-cream-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <NavLinks userRole={userRole} pathname={pathname} onNavigate={onClose} />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
