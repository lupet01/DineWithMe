import "./admin-design-system.css";
import { AdminShell } from "./components/admin-shell";
import { Role } from "@dinewithme/shared";
import { requireUserRole } from "@/lib/auth/server";
import { restaurantRepository } from "@dinewithme/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single cached call - checks auth, syncs user if needed, validates role
  const user = await requireUserRole([Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN]);

  // Onboarding sidebar only applies to a RESTAURANT_ADMIN with no Restaurant
  // row yet (§16.1 wireframe) - a PLATFORM_ADMIN legitimately has zero
  // restaurants without being "mid-onboarding", so never gets this treatment.
  const isOnboarding =
    user.role === Role.RESTAURANT_ADMIN &&
    (await restaurantRepository.findManyForUser(user.id)).length === 0;

  return (
    <AdminShell
      userRole={user.role}
      userName={user.firstName || user.email}
      isOnboarding={isOnboarding}
    >
      {children}
    </AdminShell>
  );
}
