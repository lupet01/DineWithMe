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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream-100">
      <AdminHeader
        userRole={userRole}
        userName={userName}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <div className="flex">
        <AdminSidebar
          userRole={userRole}
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
