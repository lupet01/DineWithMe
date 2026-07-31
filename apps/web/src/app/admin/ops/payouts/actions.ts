"use server";

import { auth } from "@clerk/nextjs/server";
import { userRepository, restaurantRepository, payoutRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can manage payouts" as const };
  }
  return { user: dbUser };
}

/**
 * "Process Selected Payouts" - manual v1, no Paystack Transfers
 * automation (§16.5). Only ever moves READY -> PAID; a payout that isn't
 * currently READY (e.g. someone else already processed it, or it's still
 * HELD) is silently skipped rather than failing the whole batch.
 */
export async function processSelectedPayouts(payoutIds: string[]): Promise<ActionResult<{ processedCount: number }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (payoutIds.length === 0) {
    return { success: false, error: "No payouts selected" };
  }

  try {
    const processedCount = await payoutRepository.markPaid(payoutIds);
    revalidatePath("/admin/ops/payouts");
    return { success: true, data: { processedCount } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payouts",
    };
  }
}

/**
 * Platform Ops verifying a restaurant's payout destination - the only way
 * Restaurant.bankDetailsVerifiedAt gets set. Never automatic, and never
 * set by the same update that changes the bank details (§16.5).
 */
export async function verifyBankDetails(restaurantId: string): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    await restaurantRepository.update(restaurantId, { bankDetailsVerifiedAt: new Date() });
    revalidatePath("/admin/ops/payouts");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify bank details",
    };
  }
}
