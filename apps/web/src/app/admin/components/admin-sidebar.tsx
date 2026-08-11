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
  Users,
  Flag,
  CreditCard,
  TrendingUp,
  Image,
  Utensils,
  FileText,
  UsersRound,
  Star,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@dinewithme/shared";

const restaurantNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Restaurant Profile", href: "/admin/restaurant", icon: Store },
  { name: "Meals", href: "/admin/meals", icon: Utensils },
  { name: "Media Library", href: "/admin/media-library", icon: Image },
  { name: "Team", href: "/admin/team", icon: UsersRound },
  { name: "Dinners", href: "/admin/dinners", icon: Calendar },
  { name: "Guests & Bookings", href: "/admin/guests", icon: ClipboardList },
  { name: "Payouts", href: "/admin/payouts", icon: FileText },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Guest Feedback", href: "/admin/reviews", icon: Star },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

const platformOpsNav = [
  { name: "Cockpit", href: "/admin/ops", icon: Shield },
  { name: "Restaurants", href: "/admin/ops/restaurants", icon: Building2 },
  { name: "Dinners", href: "/admin/ops/dinners", icon: Calendar },
  { name: "Payouts", href: "/admin/ops/payouts", icon: FileText },
  { name: "Analytics", href: "/admin/ops/analytics", icon: BarChart3 },
  { name: "Themes", href: "/admin/ops/themes", icon: Sparkles },
  { name: "Users", href: "/admin/ops/users", icon: Users },
  { name: "Trust & Safety", href: "/admin/ops/trust-safety", icon: Flag },
  { name: "Billing", href: "/admin/ops/billing", icon: CreditCard },
  { name: "Settings", href: "/admin/ops/settings", icon: Settings },
];

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

interface AdminSidebarProps {
  userRole: Role;
  isOnboarding?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Shown instead of the normal nav while there's no Restaurant row yet
 * (§16.1 wireframe). A one-time wizard shouldn't wear "Restaurant Profile"'s
 * identity - the same identity a restaurant returns to for years - and
 * every other item is visibly disabled rather than hidden, since there's
 * genuinely nothing behind them yet (no Restaurant means no dinners, no
 * guests, no payouts to show).
 */
function OnboardingNav() {
  return (
    <div>
      <div className="d-nav-item onboarding-active">
        <span className="d-nav-icon">
          <Sparkles className="h-4 w-4" />
        </span>
        Onboarding
      </div>
      <div className="d-nav-divider" />
      {restaurantNav
        .filter((item) => item.name !== "Restaurant Profile" && item.name !== "Settings")
        .map((item) => (
          <div key={item.href} className="d-nav-item disabled">
            <span className="d-nav-icon">
              <item.icon className="h-4 w-4" />
            </span>
            {item.name}
          </div>
        ))}
    </div>
  );
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
    <div>
      {title ? <div className="d-nav-group">{title}</div> : null}
      {items.map((item) => {
        const isActive = isItemActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn("d-nav-item", isActive && "active")}
          >
            <span className="d-nav-icon">
              <Icon className="h-4 w-4" />
            </span>
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

function NavLinks({
  userRole,
  isOnboarding,
  pathname,
  onNavigate,
}: {
  userRole: Role;
  isOnboarding?: boolean;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  if (isOnboarding) {
    return <OnboardingNav />;
  }

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

export function AdminSidebar({ userRole, isOnboarding, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="d-sidebar only-desktop">
        <NavLinks userRole={userRole} isOnboarding={isOnboarding} pathname={pathname} />
      </aside>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40 only-mobile">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <aside className="d-sidebar absolute inset-y-0 left-0 w-72 max-w-[80%] shadow-xl flex flex-col" style={{ minHeight: "100vh" }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="card-title">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="m-icon-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavLinks
                userRole={userRole}
                isOnboarding={isOnboarding}
                pathname={pathname}
                onNavigate={onClose}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
