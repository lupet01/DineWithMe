"use client";

import { useState } from "react";
import { Role } from "@dinewithme/shared";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

interface AdminShellProps {
  userRole: Role;
  userName: string;
  children: React.ReactNode;
}

export function AdminShell({ userRole, userName, children }: AdminShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminHeader
        userRole={userRole}
        userName={userName}
        onMenuClick={() => setIsMobileNavOpen(true)}
      />
      <div className="flex">
        <AdminSidebar
          userRole={userRole}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
