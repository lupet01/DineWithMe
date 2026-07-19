import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { refundPaymentIntent, type RefundReason } from "./service";

/**
 * POST /api/payments/refund
 *
 * Process a refund for a payment
 *
 * Refund Rules:
 * 1. User cancels before cutoff (24h): Full refund
 * 2. User no-shows: No refund
 * 3. Platform cancels dinner: Full refund
 *
 * Body:
 * - paymentIntentId: string
 * - reason: "user_cancelled" | "dinner_cancelled"
 *
 * Returns:
 * - success: boolean
 * - refundId: string
 * - amount: number
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId, reason } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId is required" }, { status: 400 });
    }

    if (!reason || !["user_cancelled", "dinner_cancelled"].includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be 'user_cancelled' or 'dinner_cancelled'" },
        { status: 400 }
      );
    }

    const result = await refundPaymentIntent({
      paymentIntentId,
      reason: reason as RefundReason,
      requestingUserId: user.id,
      requestingUserRole: user.role,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      data: {
        refundId: result.refundId,
        amount: result.amount,
        currency: result.currency,
        reason,
      },
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    return handleApiError(error);
  }
}
