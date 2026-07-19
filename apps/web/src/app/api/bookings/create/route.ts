import { NextRequest, NextResponse } from "next/server";
import { seatRepository, paymentIntentRepository, dinnerRepository, auditLogger } from "@dinewithme/db";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { getCommitmentAmount } from "@dinewithme/config/src/payment";
import { createPaystackService } from "@dinewithme/payment";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { withRateLimit, withCors } from "../../lib/middleware";
import { RateLimitPresets } from "@/lib/rate-limit";
import { notifySeatConfirmed } from "@/lib/notify-seat-confirmed";

/**
 * POST /api/bookings/create
 * 
 * Simplified booking flow: Hold seat + Create payment in one atomic operation
 * 
 * Flow:
 * 1. Hold seat for user
 * 2. Get dinner details and calculate amount
 * 3. Create payment intent
 * 4. Initialize Paystack transaction
 * 5. Return authorization URL for redirect
 * 
 * Body:
 * - dinnerId: string
 * - dietaryNotes: string (optional)
 *
 * Returns:
 * - seatId: string
 * - paymentIntentId: string (if paid dinner)
 * - authorizationUrl: string (if paid dinner)
 * - amount: number (if paid dinner)
 * - requiresPayment: boolean
 */
async function handlePOST(request: NextRequest) {
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
    const { dinnerId, dietaryNotes } = body;

    if (!dinnerId) {
      return NextResponse.json(
        { error: "dinnerId is required" },
        { status: 400 }
      );
    }

    // Get dinner information first
    const dinner = await dinnerRepository.findByIdWithRestaurant(dinnerId);
    if (!dinner) {
      return NextResponse.json(
        { error: "Dinner not found" },
        { status: 404 }
      );
    }

    // Track booking attempt
    await track(AnalyticsEvents.SEAT_HOLD_REQUESTED, {
      userId: user.id,
      dinnerId,
      timestamp: new Date().toISOString(),
    });

    // Step 1: Hold a seat for the dinner
    let heldSeat;
    try {
      heldSeat = await seatRepository.holdSeatForDinner(
        user.id,
        dinnerId,
        10, // 10 minutes hold
        typeof dietaryNotes === "string" ? dietaryNotes : undefined
      );

      // Log audit event
      await auditLogger.logSeatHeld(user.id, heldSeat.id, {
        dinnerId,
        holdExpiresAt: heldSeat.holdExpiresAt,
      });

      // Track success
      await track(AnalyticsEvents.SEAT_HELD_SUCCESS, {
        userId: user.id,
        dinnerId,
        seatId: heldSeat.id,
        holdExpiresAt: heldSeat.holdExpiresAt?.toISOString() || "",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await track(AnalyticsEvents.SEAT_HELD_FAILED, {
        userId: user.id,
        dinnerId,
        reason: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }

    // Step 2: Calculate commitment amount
    const amount = getCommitmentAmount(dinnerId);

    // If free dinner (amount = 0), no payment needed - confirm the seat
    // directly instead of leaving it HELD forever, since no PaymentIntent
    // is ever created for a $0 dinner to drive confirmation another way.
    if (amount === 0) {
      const confirmedSeat = await seatRepository.confirmSeat(heldSeat.id, user.id, {
        requirePayment: false,
      });

      await notifySeatConfirmed({ user, seatId: confirmedSeat.id, dinnerId });

      return NextResponse.json({
        success: true,
        data: {
          seatId: confirmedSeat.id,
          requiresPayment: false,
          message: "Seat confirmed successfully. No payment required.",
        },
      });
    }

    // Step 3: Create payment intent
    const paymentIntent = await paymentIntentRepository.createPaymentIntent({
      userId: user.id,
      dinnerId: dinner.id,
      seatId: heldSeat.id,
      amount,
      currency: "ZAR",
      provider: "PAYSTACK",
    });

    // Step 4: Initialize Paystack transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const paystack = createPaystackService(paystackSecretKey);
    
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/dinner/${dinner.id}/callback?seatId=${heldSeat.id}`;
    
    const paystackResponse = await paystack.initializeTransaction({
      email: user.email,
      amount, // Amount in kobo (cents)
      reference: paymentIntent.id,
      callback_url: callbackUrl,
      metadata: {
        paymentIntentId: paymentIntent.id,
        userId: user.id,
        dinnerId: dinner.id,
        seatId: heldSeat.id,
        restaurantName: dinner.restaurant.name,
      },
    });

    // Update payment intent with provider reference
    await paymentIntentRepository.update(paymentIntent.id, {
      providerReference: paystackResponse.data.reference,
    });

    // Track payment intent created
    await track("payment_intent_created", {
      paymentIntentId: paymentIntent.id,
      userId: user.id,
      dinnerId: dinner.id,
      seatId: heldSeat.id,
      amount,
      currency: "ZAR",
      provider: "PAYSTACK",
      restaurantId: dinner.restaurantId,
      restaurantName: dinner.restaurant.name,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        seatId: heldSeat.id,
        paymentIntentId: paymentIntent.id,
        authorizationUrl: paystackResponse.data.authorization_url,
        amount,
        currency: "ZAR",
        reference: paystackResponse.data.reference,
        requiresPayment: true,
      },
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    return handleApiError(error);
  }
}

// Apply rate limiting (strict: 10 requests per 10 seconds) and CORS
export const POST = withCors(withRateLimit(handlePOST, RateLimitPresets.STRICT));
