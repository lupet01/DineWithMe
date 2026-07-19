import { NextRequest, NextResponse } from "next/server";
import { paymentIntentRepository, seatRepository, userRepository, db } from "@dinewithme/db";
import { track } from "@dinewithme/analytics";
import { notifySeatConfirmed } from "@/lib/notify-seat-confirmed";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 * 
 * Handle Paystack webhook events
 * 
 * Events:
 * - charge.success: Payment succeeded
 * - charge.failed: Payment failed
 * 
 * Flow:
 * 1. Validate webhook signature
 * 2. Parse event data
 * 3. Prevent replay attacks
 * 4. Find payment intent by reference
 * 5. Prevent duplicate processing
 * 6. Update payment status
 * 7. If success: confirm seat
 * 8. If failed: mark payment failed
 * 9. Emit analytics
 * 
 * Security:
 * - Validates Paystack signature with HMAC
 * - Prevents replay attacks with event deduplication
 * - Idempotent (handles duplicate webhooks)
 * - No authentication required (webhook from Paystack)
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Missing Paystack signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature with HMAC
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Compute HMAC signature
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const event = JSON.parse(body);
    const eventType = event.event;
    const data = event.data;
    const eventId = event.id;

    // Prevent replay attacks - check if we've already processed this event
    const existingWebhook = await db.webhookEvent.findUnique({
      where: { externalId: eventId },
    });

    if (existingWebhook) {
      console.log(`Duplicate webhook event ${eventId}, ignoring`);
      return NextResponse.json({
        success: true,
        message: "Event already processed",
      });
    }

    // Store webhook event for deduplication
    await db.webhookEvent.create({
      data: {
        externalId: eventId,
        type: eventType,
        payload: event,
        processedAt: new Date(),
      },
    });

    console.log(`Received Paystack webhook: ${eventType}`, {
      reference: data.reference,
      status: data.status,
    });

    // Get payment intent by reference
    // Reference is our payment intent ID
    const paymentIntent = await paymentIntentRepository.findById(data.reference);

    if (!paymentIntent) {
      console.error(`Payment intent not found: ${data.reference}`);
      // Return 200 to prevent Paystack retries
      return NextResponse.json({
        success: true,
        message: "Payment intent not found",
      });
    }

    // Prevent duplicate processing
    if (paymentIntent.status === "SUCCEEDED") {
      console.log(`Payment already processed: ${paymentIntent.id}`);
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    if (paymentIntent.status === "FAILED") {
      console.log(`Payment already marked as failed: ${paymentIntent.id}`);
      return NextResponse.json({
        success: true,
        message: "Payment already marked as failed",
      });
    }

    // Handle charge.success event
    if (eventType === "charge.success" && data.status === "success") {
      console.log(`Processing successful payment: ${paymentIntent.id}`);

      // Update payment intent status
      await paymentIntentRepository.markPaymentSucceeded(
        paymentIntent.id,
        data.reference
      );

      // Confirm seat
      try {
        await seatRepository.confirmSeat(paymentIntent.seatId, paymentIntent.userId);
        console.log(`Seat confirmed: ${paymentIntent.seatId}`);

        // Best-effort - notification failures must not fail the webhook,
        // which needs to return 200 regardless (Paystack retries otherwise).
        const user = await userRepository.findById(paymentIntent.userId);
        if (user) {
          await notifySeatConfirmed({
            user,
            seatId: paymentIntent.seatId,
            dinnerId: paymentIntent.dinnerId,
          });
        }
      } catch (error) {
        console.error(`Failed to confirm seat: ${error instanceof Error ? error.message : "Unknown error"}`);
        // Payment succeeded but seat confirmation failed
        // This is a critical error that needs manual intervention
        // Log for monitoring but don't fail the webhook
      }

      // Emit analytics
      track("payment_succeeded", {
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.userId,
        dinnerId: paymentIntent.dinnerId,
        seatId: paymentIntent.seatId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: paymentIntent.provider,
        providerReference: data.reference,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment processed successfully",
      });
    }

    // Handle charge.failed event
    if (eventType === "charge.failed" || data.status === "failed") {
      console.log(`Processing failed payment: ${paymentIntent.id}`);

      // Update payment intent status
      await paymentIntentRepository.markPaymentFailed(paymentIntent.id);

      // Emit analytics
      track("payment_failed", {
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.userId,
        dinnerId: paymentIntent.dinnerId,
        seatId: paymentIntent.seatId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        provider: paymentIntent.provider,
        reason: data.gateway_response || "Payment failed",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment failure recorded",
      });
    }

    // Unknown event type
    console.log(`Unhandled webhook event: ${eventType}`);
    return NextResponse.json({
      success: true,
      message: "Event received",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    // Return 200 to prevent Paystack retries for unrecoverable errors
    // Log the error for monitoring
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 200 }); // Return 200 to prevent retries
  }
}
