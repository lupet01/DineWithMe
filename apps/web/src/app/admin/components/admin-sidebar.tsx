"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Calendar, Shield, BarChart3, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@dinewithme/shared";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  },
  {
    name: "Restaurant Profile",
    href: "/admin/restaurant",
    icon: Store,
    roles: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  },
  {
    name: "Dinners",
    href: "/admin/dinners",
    icon: Calendar,
    roles: [Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN],
  },
  {
    name: "Platform Ops",
    href: "/admin/ops",
    icon: Shield,
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: "Analytics",
    href: "/admin/ops/analytics",
    icon: BarChart3,
    roles: [Role.PLATFORM_ADMIN],
  },
  {
    name: "Users",
    href: "/admin/ops/users",
    icon: Users,
    roles: [Role.PLATFORM_ADMIN],
  },
];

interface AdminSidebarProps {
  userRole: Role;
  isOpen?: boolean;
  onClose?: () => void;
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
      {navigation.map((item) => {
        if (!item.roles.includes(userRole)) {
          return null;
        }

        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname?.startsWith(item.href + "/"));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-[44px] items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-gray-900 font-semibold shadow-card"
                : "text-gray-600 hover:bg-white/60"
            )}
          >
            <Icon className="w-5 h-5" />
            {item.name}
          </Link>
        );
      })}
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
