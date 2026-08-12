import { NextRequest, NextResponse } from "next/server";
import { paymentIntentRepository, seatRepository, userRepository, db } from "@dinewithme/db";
import { track } from "@dinewithme/analytics";
import { notifySeatConfirmed } from "@/lib/notify-seat-confirmed";
import { refundPaymentIntent } from "../refund/service";
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

    // Paystack webhooks are { event, data } with NO top-level event id, so
    // dedup must key on something that is actually present. `data.id` is the
    // Paystack transaction id (unique per transaction); scoping it by event
    // type keeps a charge.success and a charge.failed for the same
    // transaction as distinct events instead of colliding. Falls back to the
    // reference. (The previous `event.id` was always undefined, which threw on
    // the required-unique column and silently killed all webhook processing.)
    const eventId = `${eventType}:${data?.id ?? data?.reference}`;

    // Records this event as processed, for deduplication. Deliberately called
    // AFTER the work succeeds (not before) so that if processing throws, no
    // dedup record is written and Paystack's retry re-processes the event. The
    // actual work is independently idempotent — the already-SUCCEEDED/FAILED
    // state checks below and the refund service's atomic claim make a
    // re-processed event safe.
    const markProcessed = async () => {
      try {
        await db.webhookEvent.create({
          data: {
            externalId: eventId,
            type: eventType,
            payload: event,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        // A unique collision just means a concurrent delivery already recorded
        // it — not worth failing the webhook over.
        console.error(`Failed to record webhook event ${eventId}:`, err);
      }
    };

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

    // Prevent duplicate processing (state-based idempotency backstop)
    if (paymentIntent.status === "SUCCEEDED") {
      console.log(`Payment already processed: ${paymentIntent.id}`);
      await markProcessed();
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    if (paymentIntent.status === "FAILED") {
      console.log(`Payment already marked as failed: ${paymentIntent.id}`);
      await markProcessed();
      return NextResponse.json({
        success: true,
        message: "Payment already marked as failed",
      });
    }

    // Handle charge.success event
    if (eventType === "charge.success" && data.status === "success") {
      console.log(`Processing successful payment: ${paymentIntent.id}`);

      // Amount check: never confirm a seat on a success whose amount doesn't
      // match what we charged (both are in the currency subunit — cents).
      if (typeof data.amount === "number" && data.amount !== paymentIntent.amount) {
        console.error(
          `[Webhook] Amount mismatch on ${data.reference}: paystack=${data.amount} intent=${paymentIntent.amount}`
        );
        await markProcessed();
        return NextResponse.json(
          { success: false, message: "Amount mismatch" },
          { status: 200 }
        );
      }

      // Mark our record to match external reality: the money HAS been taken at
      // Paystack, so the PaymentIntent must reflect SUCCEEDED. If we then can't
      // seat the diner, the remedy is a refund (below), not pretending the
      // payment didn't happen — so there's deliberately no DB transaction
      // spanning these two writes: the payment success is an external fact we
      // cannot roll back.
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
        // Charged but could not seat — most likely the 10-minute hold expired
        // before a slow bank payment cleared. This is our failure to deliver,
        // so auto-refund the diner and raise a loud, structured alert for ops
        // reconciliation instead of silently logging "needs intervention".
        const detail = error instanceof Error ? error.message : "Unknown error";
        // Structured [ALERT] log is the operational signal for ops to page
        // on; refund analytics (payment_refunded / refund_failed) are emitted
        // inside refundPaymentIntent below, so no extra track() call here.
        console.error(
          `[ALERT] payment_confirmed_but_seat_unconfirmed paymentIntentId=${paymentIntent.id} ` +
          `seatId=${paymentIntent.seatId} userId=${paymentIntent.userId} reason="${detail}" — auto-refunding`
        );

        try {
          const refundResult = await refundPaymentIntent({
            paymentIntentId: paymentIntent.id,
            reason: "system_error",
            requestingUserId: paymentIntent.userId,
            requestingUserRole: "PLATFORM_ADMIN",
          });
          if (!refundResult.ok) {
            console.error(
              `[ALERT] auto_refund_failed paymentIntentId=${paymentIntent.id} ` +
              `error="${refundResult.error}" — MANUAL REFUND REQUIRED`
            );
          } else {
            console.log(`[Webhook] Auto-refunded unseated payment: ${paymentIntent.id}`);
          }
        } catch (refundErr) {
          console.error(
            `[ALERT] auto_refund_threw paymentIntentId=${paymentIntent.id} ` +
            `error="${refundErr instanceof Error ? refundErr.message : "Unknown"}" — MANUAL REFUND REQUIRED`
          );
        }
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

      await markProcessed();
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

      await markProcessed();
      return NextResponse.json({
        success: true,
        message: "Payment failure recorded",
      });
    }

    // Unknown event type
    console.log(`Unhandled webhook event: ${eventType}`);
    await markProcessed();
    return NextResponse.json({
      success: true,
      message: "Event received",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Return 500 so Paystack RETRIES the delivery. This is safe: the dedup
    // record is only written after successful processing, and the work is
    // independently idempotent (state checks + atomic refund claim), so a
    // retried event won't double-confirm or double-refund.
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    }, { status: 500 });
  }
}
