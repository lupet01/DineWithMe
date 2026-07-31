"use client";

import { useState } from "react";
import { Role } from "@dinewithme/shared";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  userRole: Role;
  userName: string;
  isOnboarding?: boolean;
  children: React.ReactNode;
}

export function AdminShell({ userRole, userName, isOnboarding, children }: AdminShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="dine-admin">
      <AdminHeader
        userRole={userRole}
        userName={userName}
        onMenuClick={() => setIsMobileNavOpen(true)}
      />
      <div className="d-body">
        <AdminSidebar
          userRole={userRole}
          isOnboarding={isOnboarding}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
        <main className="d-main">{children}</main>
      </div>
    </div>
  );
}
