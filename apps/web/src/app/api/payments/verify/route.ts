import { NextRequest, NextResponse } from "next/server";
import { paymentIntentRepository, seatRepository } from "@dinewithme/db";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { createPaystackService } from "@dinewithme/payment";
import { track, AnalyticsEvents } from "@dinewithme/analytics";

/**
 * POST /api/payments/verify
 * 
 * Verify a payment with Paystack and update payment intent status
 * 
 * Body:
 * - reference: string (Paystack transaction reference)
 * 
 * Returns:
 * - success: boolean
 * - status: string (success, failed, pending)
 * - payment: PaymentIntent object
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
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: "reference is required" },
        { status: 400 }
      );
    }

    // Initialize Paystack service
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const paystack = createPaystackService(paystackSecretKey);

    // Verify transaction with Paystack
    const verification = await paystack.verifyTransaction(reference);

    if (!verification.status) {
      return NextResponse.json(
        { error: "Payment verification failed", details: verification.message },
        { status: 400 }
      );
    }

    const transactionData = verification.data;

    // Find payment intent by reference
    const paymentIntent = await paymentIntentRepository.findByProviderReference(reference);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment intent not found" },
        { status: 404 }
      );
    }

    // Verify user owns this payment
    if (paymentIntent.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to verify this payment" },
        { status: 403 }
      );
    }

    // Map Paystack status to our status
    let status: "SUCCEEDED" | "FAILED" | "CREATED" = "CREATED";
    if (transactionData.status === "success") {
      status = "SUCCEEDED";
    } else if (transactionData.status === "failed") {
      status = "FAILED";
    }

    // Replay guard: this route is publicly reachable via the payment
    // redirect, so a REFUNDED (or otherwise terminal) intent must never be
    // flipped back to SUCCEEDED and re-confirmed by replaying the callback
    // URL. Only a pending intent (CREATED / REQUIRES_ACTION) may transition
    // to SUCCEEDED. An already-SUCCEEDED intent is treated idempotently; any
    // terminal state (FAILED / REFUNDED) is refused.
    const PENDING_STATES = ["CREATED", "REQUIRES_ACTION"] as const;
    if (status === "SUCCEEDED" && !PENDING_STATES.includes(paymentIntent.status as (typeof PENDING_STATES)[number])) {
      if (paymentIntent.status === "SUCCEEDED") {
        // Idempotent replay of a genuine success — nothing to do.
        return NextResponse.json({
          success: true,
          status: transactionData.status,
          payment: paymentIntent,
          message: "Payment already confirmed",
        });
      }
      // REFUNDED / FAILED / any other terminal state — do not resurrect it.
      return NextResponse.json(
        { error: `Cannot confirm a payment in ${paymentIntent.status} state` },
        { status: 409 }
      );
    }

    // Amount check: never confirm on a Paystack "success" whose amount
    // doesn't match what we charged (both are in the currency subunit —
    // cents). Guards against a tampered/mismatched reference confirming a
    // seat for the wrong amount.
    if (
      status === "SUCCEEDED" &&
      typeof transactionData.amount === "number" &&
      transactionData.amount !== paymentIntent.amount
    ) {
      console.error(
        `[Verify] Amount mismatch on ${reference}: paystack=${transactionData.amount} intent=${paymentIntent.amount}`
      );
      return NextResponse.json(
        { error: "Payment amount does not match the amount due" },
        { status: 409 }
      );
    }

    // Update payment intent
    const updatedPayment = await paymentIntentRepository.update(paymentIntent.id, {
      status,
    });

    // If payment succeeded, confirm the seat (fallback for when webhook didn't fire)
    if (status === "SUCCEEDED" && paymentIntent.seatId) {
      try {
        await seatRepository.confirmSeat(paymentIntent.seatId, paymentIntent.userId);
        console.log(`[Verify] Seat confirmed: ${paymentIntent.seatId}`);
      } catch (err) {
        // Seat may already be confirmed by webhook — that's fine
        console.log(`[Verify] Seat confirmation skipped: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Track verification
    await track(AnalyticsEvents.PAYMENT_VERIFIED, {
      paymentIntentId: paymentIntent.id,
      userId: user.id,
      status,
      amount: transactionData.amount,
      reference,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      status: transactionData.status,
      payment: updatedPayment,
      message: `Payment ${transactionData.status}`,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return handleApiError(error);
  }
}
