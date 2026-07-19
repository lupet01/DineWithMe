import { paymentIntentRepository, seatRepository, dinnerRepository } from "@dinewithme/db";
import { isRefundAllowed } from "@dinewithme/config/src/payment";
import { createPaystackService } from "@dinewithme/payment";
import { track } from "@dinewithme/analytics";
import { emailService } from "@dinewithme/email";

export type RefundReason = "user_cancelled" | "dinner_cancelled";

export type RefundResult =
  | { ok: true; refundId: string; amount: number; currency: string }
  | { ok: false; error: string; status: number };

/**
 * Core refund flow shared by POST /api/payments/refund (direct API calls)
 * and the seat-cancellation flow (api/seats/cancel), so both paths get the
 * same eligibility checks, atomic claim-before-provider-call, and
 * revert-on-provider-failure behavior instead of two divergent
 * implementations.
 */
export async function refundPaymentIntent({
  paymentIntentId,
  reason,
  requestingUserId,
  requestingUserRole,
}: {
  paymentIntentId: string;
  reason: RefundReason;
  requestingUserId: string;
  requestingUserRole: string;
}): Promise<RefundResult> {
  const paymentIntent = await paymentIntentRepository.findByIdWithRelations(paymentIntentId);
  if (!paymentIntent) {
    return { ok: false, error: "Payment intent not found", status: 404 };
  }

  if (reason === "user_cancelled" && paymentIntent.userId !== requestingUserId) {
    return { ok: false, error: "You can only refund your own payments", status: 403 };
  }

  if (paymentIntent.status !== "SUCCEEDED") {
    return {
      ok: false,
      error: `Cannot refund payment with status: ${paymentIntent.status}`,
      status: 400,
    };
  }

  const dinner = await dinnerRepository.findByIdWithRestaurant(paymentIntent.dinnerId);
  if (!dinner) {
    return { ok: false, error: "Dinner not found", status: 404 };
  }

  if (reason === "user_cancelled") {
    const refundCheck = isRefundAllowed(dinner.startsAt);
    if (!refundCheck.allowed) {
      return { ok: false, error: refundCheck.reason ?? "Refund not allowed", status: 400 };
    }
  } else if (reason === "dinner_cancelled" && requestingUserRole !== "PLATFORM_ADMIN") {
    return {
      ok: false,
      error: "Only platform admins can process dinner cancellation refunds",
      status: 403,
    };
  }

  const seat = await seatRepository.findById(paymentIntent.seatId);
  if (!seat) {
    return { ok: false, error: "Seat not found", status: 404 };
  }

  if (seat.status === "NO_SHOW") {
    return { ok: false, error: "No refund available for no-shows", status: 400 };
  }

  // Atomically claim this payment intent for refunding BEFORE calling the
  // payment provider - see paymentIntentRepository.refundPayment for why.
  try {
    await paymentIntentRepository.refundPayment(paymentIntent.id);
  } catch {
    return {
      ok: false,
      error: "This payment has already been refunded or is currently being refunded",
      status: 409,
    };
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    await paymentIntentRepository.revertRefundClaim(paymentIntent.id);
    return { ok: false, error: "PAYSTACK_SECRET_KEY not configured", status: 500 };
  }

  const paystack = createPaystackService(paystackSecretKey);

  try {
    await paystack.refundTransaction({
      reference: paymentIntent.providerReference || paymentIntent.id,
      amount: paymentIntent.amount,
      merchant_note: `Refund: ${reason}`,
      customer_note:
        reason === "dinner_cancelled"
          ? "Your dinner has been cancelled. Your payment has been refunded."
          : "Your booking has been cancelled. Your payment has been refunded.",
    });
  } catch (error) {
    // Release the claim - the provider call failed, so nothing was
    // actually refunded. Without this, the payment would be stuck marked
    // REFUNDED with no real refund having happened, and nobody could retry.
    await paymentIntentRepository.revertRefundClaim(paymentIntent.id);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
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

    return { ok: false, error: `Refund failed: ${errorMessage}`, status: 500 };
  }

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

  // Best-effort - a failed confirmation email must not undo or fail the
  // refund itself, which has already succeeded with the provider.
  try {
    await emailService.sendRefundConfirmation({
      userEmail: paymentIntent.user.email,
      userName: paymentIntent.user.firstName || paymentIntent.user.email,
      dinnerTitle: dinner.theme?.title || "your dinner",
      restaurantName: dinner.restaurant.name,
      refundAmount: paymentIntent.amount,
      currency: paymentIntent.currency,
      refundReason:
        reason === "dinner_cancelled" ? "The dinner was cancelled" : "You cancelled your booking",
      processingDays: 7,
      transactionId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Failed to send refund confirmation email:", error);
  }

  return {
    ok: true,
    refundId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  };
}
