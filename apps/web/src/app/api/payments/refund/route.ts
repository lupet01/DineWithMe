import { NextRequest, NextResponse } from "next/server";
import { paymentIntentRepository, seatRepository, dinnerRepository } from "@dinewithme/db";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { isRefundAllowed } from "@dinewithme/config/src/payment";
import { createPaystackService } from "@dinewithme/payment";
import { track } from "@dinewithme/analytics";

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
 * Flow:
 * 1. Validate user owns the payment
 * 2. Check payment is SUCCEEDED
 * 3. Check refund eligibility based on reason
 * 4. Call Paystack refund API
 * 5. Update PaymentIntent status to REFUNDED
 * 6. Emit analytics
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
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { paymentIntentId, reason } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId is required" },
        { status: 400 }
      );
    }

    if (!reason || !["user_cancelled", "dinner_cancelled"].includes(reason)) {
      return NextResponse.json(
        { error: "Invalid reason. Must be 'user_cancelled' or 'dinner_cancelled'" },
        { status: 400 }
      );
    }

    // Get payment intent with relations
    const paymentIntent = await paymentIntentRepository.findByIdWithRelations(paymentIntentId);
    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment intent not found" },
        { status: 404 }
      );
    }

    // Validate user owns the payment (unless platform admin or dinner cancelled)
    if (reason === "user_cancelled" && paymentIntent.userId !== user.id) {
      return NextResponse.json(
        { error: "You can only refund your own payments" },
        { status: 403 }
      );
    }

    // Check payment status
    if (paymentIntent.status !== "SUCCEEDED") {
      return NextResponse.json(
        { error: `Cannot refund payment with status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Get dinner information
    const dinner = await dinnerRepository.findById(paymentIntent.dinnerId);
    if (!dinner) {
      return NextResponse.json(
        { error: "Dinner not found" },
        { status: 404 }
      );
    }

    // Check refund eligibility based on reason
    if (reason === "user_cancelled") {
      // User cancellation: check cutoff time
      const refundCheck = isRefundAllowed(dinner.startsAt);
      
      if (!refundCheck.allowed) {
        return NextResponse.json(
          { 
            error: refundCheck.reason,
            hoursUntilDinner: refundCheck.hoursUntilDinner,
          },
          { status: 400 }
        );
      }
    } else if (reason === "dinner_cancelled") {
      // Platform cancellation: always allow refund
      // Verify user is platform admin
      if (user.role !== "PLATFORM_ADMIN") {
        return NextResponse.json(
          { error: "Only platform admins can process dinner cancellation refunds" },
          { status: 403 }
        );
      }
    }

    // Get seat information
    const seat = await seatRepository.findById(paymentIntent.seatId);
    if (!seat) {
      return NextResponse.json(
        { error: "Seat not found" },
        { status: 404 }
      );
    }

    // Check seat status - no refund for no-shows
    if (seat.status === "NO_SHOW") {
      return NextResponse.json(
        { error: "No refund available for no-shows" },
        { status: 400 }
      );
    }

    // Atomically claim this payment intent for refunding BEFORE calling the
    // payment provider. This is a guarded update (only succeeds if the status
    // is still SUCCEEDED) — if two concurrent refund requests race, only one
    // wins the claim here and the other is rejected immediately, before ever
    // reaching Paystack. Without this, both could pass the read-only status
    // check above and both call Paystack's live refund endpoint.
    try {
      await paymentIntentRepository.refundPayment(paymentIntent.id);
    } catch {
      return NextResponse.json(
        { error: "This payment has already been refunded or is currently being refunded" },
        { status: 409 }
      );
    }

    // Process refund through Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      // Release the claim — nothing was actually refunded
      await paymentIntentRepository.revertRefundClaim(paymentIntent.id);
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const paystack = createPaystackService(paystackSecretKey);

    try {
      const refundResponse = await paystack.refundTransaction({
        reference: paymentIntent.providerReference || paymentIntent.id,
        amount: paymentIntent.amount, // Full refund
        merchant_note: `Refund: ${reason}`,
        customer_note: reason === "dinner_cancelled"
          ? "Your dinner has been cancelled. Your payment has been refunded."
          : "Your booking has been cancelled. Your payment has been refunded.",
      });

      console.log("Paystack refund successful:", refundResponse);
    } catch (error) {
      console.error("Paystack refund failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Release the claim — the provider call failed, so nothing was
      // actually refunded. Without this, the payment would be stuck marked
      // REFUNDED with no real refund having happened, and nobody could retry.
      await paymentIntentRepository.revertRefundClaim(paymentIntent.id);

      // Emit refund failed analytics
      track("refund_failed", {
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.userId,
        dinnerId: paymentIntent.dinnerId,
        seatId: paymentIntent.seatId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: paymentIntent.provider,
        reason,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: `Refund failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Emit analytics
    track("payment_refunded", {
      paymentIntentId: paymentIntent.id,
      userId: paymentIntent.userId,
      dinnerId: paymentIntent.dinnerId,
      seatId: paymentIntent.seatId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      provider: paymentIntent.provider,
      reason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        refundId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        reason,
      },
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    return handleApiError(error);
  }
}
