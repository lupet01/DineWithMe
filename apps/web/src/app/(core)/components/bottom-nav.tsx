"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/discover", icon: Home },
  { label: "Reservations", href: "/my-dinners", icon: Calendar },
  { label: "Connections", href: "/connections", icon: Heart },
  { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const shouldHideNav =
    pathname.startsWith("/dinner/") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (shouldHideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-5 pt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-primary-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary-500" : "text-gray-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary-500" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
