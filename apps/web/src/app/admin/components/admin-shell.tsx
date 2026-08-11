import { Role } from "@dinewithme/shared";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";
import { AdminBottomNav } from "./admin-bottom-nav";

interface AdminShellProps {
  userRole: Role;
  userName: string;
  isOnboarding?: boolean;
  children: React.ReactNode;
}

export function AdminShell({ userRole, userName, isOnboarding, children }: AdminShellProps) {
  return (
    <div className="dine-admin">
      <AdminHeader userRole={userRole} userName={userName} />
      <div className="d-body">
        <AdminSidebar userRole={userRole} isOnboarding={isOnboarding} />
        <main className="d-main">{children}</main>
      </div>
      <AdminBottomNav isOnboarding={isOnboarding} />
    </div>
  );
}
