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

export const BANK_ACCOUNT_TYPES = [
  "Business Cheque",
  "Business Savings",
  "Personal Cheque",
  "Personal Savings",
] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export interface BankDetailsInput {
  bankName: string;
  bankBranchCode: string;
  bankAccountType: string;
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

  if (
    !input.bankName.trim() ||
    !input.bankBranchCode.trim() ||
    !input.bankAccountType.trim() ||
    !input.bankAccountNumber.trim() ||
    !input.bankAccountHolderName.trim()
  ) {
    return { success: false, error: "All bank detail fields are required" };
  }
  if (!/^[0-9]{4,20}$/.test(input.bankAccountNumber.trim())) {
    return { success: false, error: "Account number must be 4-20 digits" };
  }
  if (!/^[0-9]{4,10}$/.test(input.bankBranchCode.trim())) {
    return { success: false, error: "Branch code must be 4-10 digits" };
  }
  if (!BANK_ACCOUNT_TYPES.includes(input.bankAccountType.trim() as BankAccountType)) {
    return { success: false, error: "Please choose a valid account type" };
  }

  try {
    await restaurantRepository.update(restaurantId, {
      bankName: input.bankName.trim(),
      bankBranchCode: input.bankBranchCode.trim(),
      bankAccountType: input.bankAccountType.trim(),
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
