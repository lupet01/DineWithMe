"use server";

import { redirect } from "next/navigation";
import { userRepository, restaurantRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { requireAuthUser } from "@/lib/auth/server";

/**
 * The missing bootstrapping step (wireframe §sec-partner-apply): today the
 * only way to become a RESTAURANT_ADMIN is a platform admin manually
 * flipping a role dropdown. This is the self-service alternative — any
 * signed-in diner can apply here.
 *
 * `userRepository.updateRole` is documented "platform admin only - enforced
 * by callers"; this is a deliberate, narrow exception to that rule, not a
 * violation of it — a user promoting *themselves* by explicitly applying is
 * a different authorization context than an admin changing someone else's
 * role, and it's the only self-service path that exists for this.
 *
 * Deliberately does NOT create a Restaurant row here, unlike the wireframe's
 * literal "in one transaction" phrasing — the already-built 4-step
 * onboarding wizard (`restaurant-onboarding-wizard.tsx`) creates the
 * Restaurant itself, with full data, only at its final Submit step via the
 * existing `createRestaurant()` action. Pre-creating a bare row here would
 * require that wizard to switch into an edit-mode it isn't built for.
 * Promoting the role is enough on its own to unlock the wizard:
 * `admin/layout.tsx`'s `isOnboarding` check is exactly
 * `role === RESTAURANT_ADMIN && zero restaurants`, which this satisfies.
 */
export async function applyToPartner(): Promise<void> {
  const user = await requireAuthUser();

  // A platform admin has no business "applying" — this must never touch
  // their role. Send them to their real dashboard instead. This is a
  // correctness fix, not just a UX nicety: the previous version's
  // `role !== RESTAURANT_ADMIN` check didn't exclude PLATFORM_ADMIN, so a
  // platform admin who ever landed on this page would have been silently
  // demoted to RESTAURANT_ADMIN by the block below.
  if (user.role === Role.PLATFORM_ADMIN) {
    redirect("/admin");
  }

  // Already a restaurant admin with a restaurant — nothing to apply for,
  // send them to their actual dashboard instead of re-running this flow.
  if (user.role === Role.RESTAURANT_ADMIN) {
    const existingRestaurants = await restaurantRepository.findManyForUser(user.id);
    if (existingRestaurants.length > 0) {
      redirect("/admin");
    }
  }

  // Only a plain DINER is actually promoted — this is the one real
  // "self-service" transition this action exists for.
  if (user.role === Role.DINER) {
    await userRepository.updateRole(user.id, Role.RESTAURANT_ADMIN);
  }

  redirect("/admin/restaurant");
}
