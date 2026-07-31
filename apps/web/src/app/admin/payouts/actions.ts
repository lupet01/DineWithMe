"use server";

import { revalidatePath } from "next/cache";
import { restaurantRepository, encrypt } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage payouts for this restaurant" as const };
  }
  return { user };
}

export interface BankDetailsInput {
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
}

/**
 * Updates a restaurant's payout destination. Always clears
 * bankDetailsVerifiedAt, regardless of what changed - a changed bank
 * account can never silently inherit a stale verification, only a fresh
 * Platform Ops verify action (ops/payouts, not built here) can set it
 * again. This is the one piece of write logic that actually enforces the
 * "re-trigger verification, not save instantly" rule from §16.5 - it is
 * not optional, not a UI nicety.
 */
export async function updateBankDetails(
  restaurantId: string,
  input: BankDetailsInput
): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!input.bankName.trim() || !input.bankAccountNumber.trim() || !input.bankAccountHolderName.trim()) {
    return { success: false, error: "Bank name, account number, and account holder name are all required" };
  }
  if (!/^[0-9]{4,20}$/.test(input.bankAccountNumber.trim())) {
    return { success: false, error: "Account number must be 4-20 digits" };
  }

  try {
    await restaurantRepository.update(restaurantId, {
      bankName: input.bankName.trim(),
      bankAccountNumber: encrypt(input.bankAccountNumber.trim()),
      bankAccountHolderName: input.bankAccountHolderName.trim(),
      bankDetailsVerifiedAt: null,
    });

    revalidatePath("/admin/payouts");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update bank details",
    };
  }
}
