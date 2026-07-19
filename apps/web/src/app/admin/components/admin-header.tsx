"use client";

import { Menu } from "lucide-react";
import { Role } from "@dinewithme/shared";
import { UserButton } from "@clerk/nextjs";

interface AdminHeaderProps {
  userRole: Role;
  userName: string;
  onMenuClick?: () => void;
}

export function AdminHeader({ userRole, userName, onMenuClick }: AdminHeaderProps) {
  const roleLabel =
    userRole === Role.PLATFORM_ADMIN ? "Platform Admin" : "Restaurant Admin";

  return (
    <header className="bg-cream-100/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Menu button (mobile) + Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              className="md:hidden -ml-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-700 hover:bg-cream-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="text-xl font-extrabold tracking-tight text-gray-900 truncate">DineWithMe</div>
          <div className="hidden sm:block text-xs text-gray-500 font-semibold px-2.5 py-1 bg-cream-200 rounded-full">
            Admin
          </div>
          {userRole === Role.PLATFORM_ADMIN && (
            <div className="hidden sm:block text-xs font-semibold px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full">
              Platform
            </div>
          )}
        </div>

        {/* Right: User info */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900">{userName}</div>
            <div className="text-xs text-gray-500">{roleLabel}</div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
