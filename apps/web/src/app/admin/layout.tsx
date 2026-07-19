import { AdminShell } from "./components/admin-shell";
import { Role } from "@dinewithme/shared";
import { requireUserRole } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single cached call - checks auth, syncs user if needed, validates role
  const user = await requireUserRole([Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN]);

  return (
    <AdminShell userRole={user.role} userName={user.firstName || user.email}>
      {children}
    </AdminShell>
  );
}
