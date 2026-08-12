"use server";

import { auth } from "@clerk/nextjs/server";
import { actionFailure, type ActionResult, Role } from "@dinewithme/shared";
import { userRepository, restaurantRepository, payoutRepository, auditLogger } from "@dinewithme/db";
import { emailService } from "@dinewithme/email";
import { revalidatePath } from "next/cache";

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
    // Capture the settleable set (with owner emails + amounts) BEFORE marking
    // paid, so we can notify + audit exactly what settles.
    const settleable = await payoutRepository.findSettleableWithOwner(payoutIds);
    const processedCount = await payoutRepository.markPaid(payoutIds);

    // Audit each settlement (immutable financial trail) and notify the
    // restaurant owners that they've been paid. Both are best-effort — a
    // failed email or audit write must not undo a completed settlement.
    for (const payout of settleable) {
      await auditLogger.payoutSettled(authResult.user.id, payout.id, {
        restaurantId: payout.restaurantId,
        netAmountCents: payout.netAmountCents,
      });

      for (const ownerEmail of payout.ownerEmails) {
        try {
          await emailService.sendPayoutPaid({
            ownerEmail,
            ownerName: payout.restaurantName,
            restaurantName: payout.restaurantName,
            dinnerTitle: payout.dinnerTitle ?? "your dinner",
            payoutAmount: payout.netAmountCents,
            currency: "ZAR",
            payoutId: payout.id,
          });
        } catch (emailError) {
          console.error(`Failed to send payout email for ${payout.id}:`, emailError);
        }
      }
    }

    revalidatePath("/admin/ops/payouts");
    return { success: true, data: { processedCount } };
  } catch (error) {
    return actionFailure(error, "Failed to process payouts");
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
    await auditLogger.bankDetailsVerified(authResult.user.id, restaurantId);
    revalidatePath("/admin/ops/payouts");
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to verify bank details");
  }
}
