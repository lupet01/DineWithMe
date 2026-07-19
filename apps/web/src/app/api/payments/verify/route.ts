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
