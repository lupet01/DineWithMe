import { NextRequest, NextResponse } from "next/server";
import { seatRepository, paymentIntentRepository, dinnerRepository } from "@dinewithme/db";
import { handleApiError } from "../../lib/error-handler";
import { getCurrentUser } from "@/lib/auth";
import { getCommitmentAmount } from "@dinewithme/config/src/payment";
import { createPaystackService } from "@dinewithme/payment";
import { track } from "@dinewithme/analytics";
import { withRateLimit, withCors } from "../../lib/middleware";
import { RateLimitPresets } from "@/lib/rate-limit";

/**
 * POST /api/payments/create
 * 
 * Create a payment intent for a held seat
 * 
 * Flow:
 * 1. Validate seat is HELD by current user
 * 2. Calculate commitment amount
 * 3. Create PaymentIntent with status CREATED
 * 4. Call Paystack initialize transaction API
 * 5. Store providerReference
 * 6. Return payment authorization URL
 * 
 * Body:
 * - seatId: string
 * 
 * Returns:
 * - paymentIntentId: string
 * - authorizationUrl: string
 * - amount: number (in cents)
 * - reference: string
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
    const { seatId } = body;

    if (!seatId) {
      return NextResponse.json(
        { error: "seatId is required" },
        { status: 400 }
      );
    }

    // Get seat with dinner information
    const seat = await seatRepository.findById(seatId);
    if (!seat) {
      return NextResponse.json(
        { error: "Seat not found" },
        { status: 404 }
      );
    }

    // Validate seat is HELD by current user
    if (seat.status !== "HELD") {
      return NextResponse.json(
        { error: `Seat is not held. Current status: ${seat.status}` },
        { status: 400 }
      );
    }

    if (seat.heldByUserId !== user.id) {
      return NextResponse.json(
        { error: "Seat is held by a different user" },
        { status: 403 }
      );
    }

    // Check if hold has expired
    if (seat.holdExpiresAt && seat.holdExpiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Seat hold has expired" },
        { status: 400 }
      );
    }

    // Get dinner information
    const dinner = await dinnerRepository.findByIdWithRestaurant(seat.dinnerId);
    if (!dinner) {
      return NextResponse.json(
        { error: "Dinner not found" },
        { status: 404 }
      );
    }

    // Check if payment intent already exists for this seat
    const existingPayment = await paymentIntentRepository.findBySeat(seatId);
    if (existingPayment && existingPayment.status === "SUCCEEDED") {
      return NextResponse.json(
        { error: "Payment already completed for this seat" },
        { status: 400 }
      );
    }

    // Calculate commitment amount
    const amount = getCommitmentAmount(dinner.id);

    // Create payment intent
    const paymentIntent = await paymentIntentRepository.createPaymentIntent({
      userId: user.id,
      dinnerId: dinner.id,
      seatId: seat.id,
      amount,
      currency: "ZAR",
      provider: "PAYSTACK",
    });

    // Initialize Paystack transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    const paystack = createPaystackService(paystackSecretKey);
    
    const paystackResponse = await paystack.initializeTransaction({
      email: user.email,
      amount, // Amount in kobo (cents)
      reference: paymentIntent.id, // Use our payment intent ID as reference
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/dinner/${dinner.id}/callback?seatId=${seat.id}`,
      metadata: {
        paymentIntentId: paymentIntent.id,
        userId: user.id,
        dinnerId: dinner.id,
        seatId: seat.id,
        restaurantName: dinner.restaurant.name,
      },
    });

    // Update payment intent with provider reference
    await paymentIntentRepository.update(paymentIntent.id, {
      providerReference: paystackResponse.data.reference,
    });

    // Emit analytics event
    track("payment_intent_created", {
      paymentIntentId: paymentIntent.id,
      userId: user.id,
      dinnerId: dinner.id,
      seatId: seat.id,
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
        paymentIntentId: paymentIntent.id,
        authorizationUrl: paystackResponse.data.authorization_url,
        amount,
        currency: "ZAR",
        reference: paystackResponse.data.reference,
      },
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return handleApiError(error);
  }
}

// Apply rate limiting (strict: 10 requests per 10 seconds) and CORS
export const POST = withCors(withRateLimit(handlePOST, RateLimitPresets.STRICT));
