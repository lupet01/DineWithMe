"use client";

import { Utensils } from "lucide-react";
import { Role } from "@dinewithme/shared";
import { UserButton } from "@clerk/nextjs";

interface AdminHeaderProps {
  userRole: Role;
  userName: string;
}

export function AdminHeader({ userRole, userName }: AdminHeaderProps) {
  const roleLabel = userRole === Role.PLATFORM_ADMIN ? "Platform Admin" : "Restaurant Admin";

  return (
    <header className="d-topbar">
      <div className="d-logo">
        <div className="d-logo-mark">
          <Utensils className="h-3.5 w-3.5" />
        </div>
        <div className="d-logo-text">DineWithMe</div>
        <div className="d-logo-chip only-desktop">Admin</div>
        {userRole === Role.PLATFORM_ADMIN && (
          <div className="d-logo-chip purple only-desktop">Platform</div>
        )}
      </div>

      <div className="d-user">
        <div className="only-desktop">
          <div className="d-user-name">{userName}</div>
          <div className="d-user-role">{roleLabel}</div>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8 rounded-full" } }} />
      </div>
    </header>
  );
}
