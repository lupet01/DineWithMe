# 🚀 PRODUCTION DEPLOYMENT PLAN
## DineWithMe - Comprehensive Implementation Roadmap

**Document Version**: 1.0  
**Created**: March 7, 2026  
**Status**: Ready for Implementation  
**Estimated Timeline**: 3-5 days for critical fixes, 7-10 days for complete deployment

---

## 📋 FILES REVIEWED FOR THIS PLAN

### Core Documentation
1. ✅ FLOW_SIMPLIFICATION_OPPORTUNITIES.md
2. ✅ MVP_CRITICAL_FIXES_SPEC.md
3. ✅ README.md
4. ✅ WIREFRAMES_IMPLEMENTATION_ANALYSIS.md

### System Check Reports (All 18 Sections)
5. ✅ SECTION_1_AUTH_REPORT.md (Grade: B+, 85/100)
6. ✅ SECTION_2_DATABASE_REPORT.md (Grade: A+, 98/100)
7. ✅ SECTION_3_SEAT_STATE_MACHINE_REPORT.md (Grade: B, 80/100 - CRITICAL BUG)
8. ✅ SECTION_4_PAYMENT_SYSTEM_REPORT.md (Grade: A-, 92/100)
9. ✅ SECTION_5_TRUST_SAFETY_REPORT.md (Grade: A+, 96/100)
10. ✅ SECTION_6_RESTAURANT_MGMT_REPORT.md (Grade: B+, 87/100)
11. ✅ SECTION_7_RESTAURANT_ADMIN_REPORT.md (Grade: A+, 98/100)
12. ✅ SECTION_8_DINER_DISCOVERY_REPORT.md (Grade: A-)
13. ✅ SECTION_9_MY_DINNERS_USER_MGMT_REPORT.md (Grade: A)
14. ✅ SECTION_10_POST_DINNER_FEEDBACK_REPORT.md (Grade: A)
15. ✅ SECTION_11_MEDIA_STORAGE_REPORT.md (Grade: A+)
16. ✅ SECTION_12_ANALYTICS_TRACKING_REPORT.md (Grade: A)
17. ✅ SECTION_13_CRON_JOBS_REPORT.md (Grade: A)
18. ✅ SECTION_14_NAVIGATION_ROUTING_REPORT.md (Grade: B+)
19. ✅ SECTION_15_ERROR_VALIDATION_REPORT.md (Grade: B+)
20. ✅ SECTION_16_CONFIG_ENVIRONMENT_REPORT.md (Grade: B - CRITICAL SECURITY)
21. ✅ SECTION_17_QR_CHECKIN_REPORT.md (Grade: B+)
22. ✅ SECTION_18_AUDIT_LOGGING_REPORT.md (Grade: B+)

---

## 🎯 EXECUTIVE SUMMARY

### Current State
- **Backend Quality**: 95% complete, excellent architecture
- **Database**: Production-ready (Grade A+)
- **Payment System**: Backend complete, frontend UI missing
- **Trust & Safety**: Excellent implementation (Grade A+)
- **Critical Blockers**: 2 (booking flow broken, security exposure)
- **High Priority Issues**: 5 (payment UI, type errors, QR display, emails, env validation)
- **Medium Priority**: 8 (navigation, analytics, optimizations)

### Key Insight
The application has a rock-solid backend with excellent architecture. Most issues are missing frontend UI components or type mismatches. No major refactoring needed - just surgical fixes and UI completion.

---

## 🔥 PHASE 1: CRITICAL BLOCKERS (Day 1-2)
### Must Fix Before ANY Production Launch


### 🔴 BLOCKER 1: Fix Broken Booking Confirmation Flow
**Priority**: CRITICAL - BLOCKS ALL REVENUE  
**Impact**: Users cannot complete bookings, no revenue possible  
**Source**: SECTION_3_SEAT_STATE_MACHINE_REPORT.md, MVP_CRITICAL_FIXES_SPEC.md  
**Estimated Time**: 2-3 hours

#### Problem
The confirmation page (`apps/web/src/app/(core)/dinner/[id]/confirm/page.tsx`) calls the deprecated `/api/seats/confirm` endpoint which returns `410 Gone`. This completely breaks the booking flow.

#### Root Cause
```typescript
// CURRENT BROKEN CODE in confirmation-content.tsx
const response = await fetch(`/api/seats/confirm`, {
  method: "POST",
  body: JSON.stringify({ seatId, dinnerId }),
});
```

The `/api/seats/confirm/route.ts` endpoint was deprecated and returns:
```typescript
return NextResponse.json(
  { error: "This endpoint is deprecated. Use /api/seats/hold instead." },
  { status: 410 }
);
```

#### Technical Solution

**Step 1**: Update confirmation flow to use correct endpoint sequence

File: `apps/web/src/app/(core)/dinner/[id]/confirm/components/confirmation-content.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmationSkeleton from "./confirmation-skeleton";
import ConfirmationSuccess from "./confirmation-success";
import ConfirmationError from "./confirmation-error";

export default function ConfirmationContent({ dinnerId }: { dinnerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [seatData, setSeatData] = useState<any>(null);

  useEffect(() => {
    const confirmBooking = async () => {
      try {
        const seatId = searchParams.get("seatId");
        const paymentIntentId = searchParams.get("payment_intent");

        if (!seatId) {
          setErrorMessage("Missing seat information");
          setStatus("error");
          return;
        }

        // Step 1: Verify payment if payment_intent exists
        if (paymentIntentId) {
          const paymentResponse = await fetch(`/api/payments/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId }),
          });

          if (!paymentResponse.ok) {
            const error = await paymentResponse.json();
            setErrorMessage(error.error || "Payment verification failed");
            setStatus("error");
            return;
          }
        }

        // Step 2: Confirm the seat (moves from HELD -> CONFIRMED)
        // The seat should already be in HELD state from the hold endpoint
        // We just need to verify it's still valid and mark as confirmed
        const confirmResponse = await fetch(`/api/seats/${seatId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dinnerId }),
        });

        if (!confirmResponse.ok) {
          const error = await confirmResponse.json();
          setErrorMessage(error.error || "Failed to confirm booking");
          setStatus("error");
          return;
        }

        const data = await confirmResponse.json();
        setSeatData(data.seat);
        setStatus("success");

        // Track successful booking
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "booking_confirmed", {
            dinner_id: dinnerId,
            seat_id: seatId,
          });
        }
      } catch (error) {
        console.error("Confirmation error:", error);
        setErrorMessage("An unexpected error occurred");
        setStatus("error");
      }
    };

    confirmBooking();
  }, [dinnerId, searchParams]);

  if (status === "loading") {
    return <ConfirmationSkeleton />;
  }

  if (status === "error") {
    return <ConfirmationError message={errorMessage} dinnerId={dinnerId} />;
  }

  return <ConfirmationSuccess seat={seatData} dinnerId={dinnerId} />;
}
```

**Step 2**: Create new confirmation endpoint

File: `apps/web/src/app/api/seats/[seatId]/confirm/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { seatStateMachine } from "@repo/db";
import { handleApiError } from "@/app/api/lib/error-handler";
import { z } from "zod";

const confirmSchema = z.object({
  dinnerId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { seatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seatId = params.seatId;
    const body = await req.json();
    const validation = confirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { dinnerId } = validation.data;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Verify seat exists and belongs to user
    const seat = await db.seat.findUnique({
      where: { id: seatId },
      include: {
        dinner: true,
        user: true,
      },
    });

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (seat.userId !== user.id) {
      return NextResponse.json(
        { error: "This seat does not belong to you" },
        { status: 403 }
      );
    }

    if (seat.dinnerId !== dinnerId) {
      return NextResponse.json(
        { error: "Seat does not belong to this dinner" },
        { status: 400 }
      );
    }

    // Confirm the seat using state machine
    const confirmedSeat = await seatStateMachine.confirmSeat(seatId, user.id);

    // Track analytics
    await db.analytics.create({
      data: {
        eventType: "booking_confirmed",
        userId: user.id,
        dinnerId: dinnerId,
        metadata: {
          seatId: seatId,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      seat: confirmedSeat,
      message: "Booking confirmed successfully",
    });
  } catch (error: any) {
    console.error("Seat confirmation error:", error);
    return handleApiError(error);
  }
}
```

**Step 3**: Update payment flow to redirect correctly

File: `apps/web/src/app/(core)/dinner/[id]/components/dinner-cta.tsx`

Update the handleBooking function to use the hold endpoint and redirect to confirmation:

```typescript
const handleBooking = async () => {
  try {
    setIsLoading(true);

    // Step 1: Hold the seat
    const holdResponse = await fetch(`/api/seats/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dinnerId: dinner.id }),
    });

    if (!holdResponse.ok) {
      const error = await holdResponse.json();
      toast.error(error.error || "Failed to hold seat");
      return;
    }

    const { seat } = await holdResponse.json();

    // Step 2: If dinner requires payment, initiate payment
    if (dinner.price > 0) {
      const paymentResponse = await fetch(`/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatId: seat.id,
          dinnerId: dinner.id,
          amount: dinner.price,
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        toast.error(error.error || "Failed to initiate payment");
        return;
      }

      const { authorizationUrl } = await paymentResponse.json();
      
      // Redirect to Paystack with return URL to confirmation page
      const returnUrl = `${window.location.origin}/dinner/${dinner.id}/confirm?seatId=${seat.id}`;
      window.location.href = `${authorizationUrl}&callback_url=${encodeURIComponent(returnUrl)}`;
    } else {
      // Free dinner - go directly to confirmation
      router.push(`/dinner/${dinner.id}/confirm?seatId=${seat.id}`);
    }
  } catch (error) {
    console.error("Booking error:", error);
    toast.error("An unexpected error occurred");
  } finally {
    setIsLoading(false);
  }
};
```

**Step 4**: Delete deprecated endpoint

File: `apps/web/src/app/api/seats/confirm/route.ts`

Delete this entire file as it's deprecated and causing confusion.

#### Verification Steps
1. Test free dinner booking flow (no payment)
2. Test paid dinner booking flow (with Paystack)
3. Verify seat state transitions: AVAILABLE → HELD → CONFIRMED
4. Check analytics tracking for booking_confirmed event
5. Test error cases (expired hold, invalid seat, etc.)

#### Success Criteria
- ✅ Users can complete bookings for free dinners
- ✅ Users can complete bookings for paid dinners
- ✅ Confirmation page shows success message
- ✅ Seat state is CONFIRMED in database
- ✅ Analytics event is tracked
- ✅ No 410 errors in console

---

### 🔴 BLOCKER 2: Remove Exposed Credentials from .env.example Files
**Priority**: CRITICAL - SECURITY BREACH  
**Impact**: Real production credentials exposed in repository  
**Source**: SECTION_16_CONFIG_ENVIRONMENT_REPORT.md  
**Estimated Time**: 30 minutes

#### Problem
Real production credentials are hardcoded in `.env.example` files:
- Cloudflare R2 credentials (Account ID, Access Key, Secret Key)
- Clerk publishable keys
- Database URLs with real hostnames

#### Security Risk
- Anyone with repository access can see production credentials
- Credentials may be indexed by search engines if repo is public
- Violates security best practices
- Could lead to unauthorized access to production resources

#### Technical Solution

**Step 1**: Sanitize root `.env.example`

File: `.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dinewithme"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CLERK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Cloudflare R2 Storage
R2_ACCOUNT_ID="your_account_id_here"
R2_ACCESS_KEY_ID="your_access_key_here"
R2_SECRET_ACCESS_KEY="your_secret_key_here"
R2_BUCKET_NAME="dinewithme-media"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"

# Paystack Payment
PAYSTACK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Step 2**: Sanitize web app `.env.example`

File: `apps/web/.env.example`

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dinewithme"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
CLERK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Cloudflare R2 Storage
R2_ACCOUNT_ID="your_account_id_here"
R2_ACCESS_KEY_ID="your_access_key_here"
R2_SECRET_ACCESS_KEY="your_secret_key_here"
R2_BUCKET_NAME="dinewithme-media"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"

# Paystack Payment
PAYSTACK_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Step 3**: Rotate compromised credentials

IMMEDIATELY rotate these credentials in production:

1. **Cloudflare R2**:
   - Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - Delete exposed access key
   - Create new API token with same permissions
   - Update production `.env` file

2. **Clerk**:
   - Go to Clerk Dashboard → API Keys
   - Rotate secret key (publishable key is safe to expose)
   - Update production `.env` file

3. **Paystack**:
   - Go to Paystack Dashboard → Settings → API Keys & Webhooks
   - Regenerate secret key
   - Update production `.env` file

**Step 4**: Add .env files to .gitignore (verify)

File: `.gitignore`

Ensure these lines exist:
```
# Environment variables
.env
.env.local
.env.*.local
apps/web/.env
apps/web/.env.local
```

**Step 5**: Create setup documentation

File: `docs/ENVIRONMENT_SETUP.md` (NEW FILE)

```markdown
# Environment Setup Guide

## Required Environment Variables

### 1. Database (PostgreSQL)

```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

Get from your PostgreSQL provider (Neon, Supabase, Railway, etc.)

### 2. Clerk Authentication

1. Go to https://clerk.com
2. Create new application
3. Copy keys from Dashboard → API Keys

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Cloudflare R2 Storage

1. Go to Cloudflare Dashboard → R2
2. Create bucket named "dinewithme-media"
3. Go to Manage R2 API Tokens → Create API Token
4. Select "Object Read & Write" permissions

```bash
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="dinewithme-media"
R2_PUBLIC_URL="https://your-bucket.r2.cloudflarestorage.com"
```

### 4. Paystack Payment

1. Go to https://paystack.com
2. Sign up / Log in
3. Go to Settings → API Keys & Webhooks

```bash
PAYSTACK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
```

### 5. Application URLs

```bash
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 6. Optional: Google Analytics

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

## Setup Steps

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env
   ```

2. Fill in all values in both `.env` files

3. Run database migrations:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Security Notes

- NEVER commit `.env` files to git
- NEVER share secret keys publicly
- Use different keys for development and production
- Rotate keys if accidentally exposed
```

#### Verification Steps
1. Check `.env.example` files contain only placeholder values
2. Verify real `.env` files are in `.gitignore`
3. Confirm new credentials work in production
4. Search codebase for any other hardcoded credentials

#### Success Criteria
- ✅ No real credentials in `.env.example` files
- ✅ All production credentials rotated
- ✅ Setup documentation created
- ✅ `.env` files properly gitignored

---

## 🟠 PHASE 2: HIGH PRIORITY FIXES (Day 2-3)
### Required for Functional MVP

### 🟠 HIGH-1: Implement Payment UI Pages
**Priority**: HIGH - Payment backend ready but no UI  
**Impact**: Users cannot see payment status or history  
**Source**: SECTION_3_SEAT_STATE_MACHINE_REPORT.md, SECTION_4_PAYMENT_SYSTEM_REPORT.md  
**Estimated Time**: 4-6 hours

#### Problem
Payment backend is complete and working, but frontend UI pages are missing:
- No payment verification page
- No payment success/failure feedback
- No payment history view

#### Technical Solution

**Step 1**: Create payment verification endpoint

File: `apps/web/src/app/api/payments/verify/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { paystackProvider } from "@repo/payment";
import { handleApiError } from "@/app/api/lib/error-handler";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Get payment intent from database
    const paymentIntent = await db.paymentIntent.findUnique({
      where: { id: paymentIntentId },
      include: { seat: true, user: true },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment intent not found" },
        { status: 404 }
      );
    }

    // Verify user owns this payment
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || paymentIntent.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to verify this payment" },
        { status: 403 }
      );
    }

    // Verify payment with Paystack
    const verification = await paystackProvider.verifyPayment(
      paymentIntent.providerReference
    );

    if (!verification.success) {
      return NextResponse.json(
        { error: "Payment verification failed", details: verification.error },
        { status: 400 }
      );
    }

    // Update payment intent status
    const updatedIntent = await db.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: verification.data.status === "success" ? "SUCCEEDED" : "FAILED",
        metadata: {
          ...paymentIntent.metadata,
          verifiedAt: new Date().toISOString(),
          paystackData: verification.data,
        },
      },
    });

    return NextResponse.json({
      success: true,
      payment: updatedIntent,
      verified: verification.data.status === "success",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return handleApiError(error);
  }
}
```

**Step 2**: Create payment history page

File: `apps/web/src/app/(core)/payments/page.tsx` (NEW FILE)

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PageHeader from "../components/page-header";
import { formatCurrency, formatDate } from "@repo/shared/utils";

export default async function PaymentsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) redirect("/sign-in");

  const payments = await db.paymentIntent.findMany({
    where: { userId: user.id },
    include: {
      seat: {
        include: {
          dinner: {
            include: {
              restaurant: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Payment History" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No payment history yet</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {payment.seat.dinner.restaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(payment.seat.dinner.scheduledAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(payment.amount)}
                  </p>
                  <StatusBadge status={payment.status} />
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Payment ID: {payment.id}</p>
                <p>Reference: {payment.providerReference}</p>
                <p>Date: {formatDate(payment.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    SUCCEEDED: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        styles[status as keyof typeof styles] || styles.PENDING
      }`}
    >
      {status}
    </span>
  );
}
```

**Step 3**: Add payment link to navigation

File: `apps/web/src/app/(core)/components/bottom-nav.tsx`

Add payment history link to the navigation (optional, or add to profile page).

#### Verification Steps
1. Complete a paid booking
2. Verify payment verification endpoint works
3. Check payment history page displays correctly
4. Test different payment statuses (success, failed, pending)

#### Success Criteria
- ✅ Payment verification endpoint working
- ✅ Payment history page displays all payments
- ✅ Status badges show correct colors
- ✅ Payment details are accurate

---

### 🟠 HIGH-2: Fix Theme Type Errors
**Priority**: HIGH - Breaks TypeScript compilation  
**Impact**: Type errors prevent production build  
**Source**: SECTION_6_RESTAURANT_MGMT_REPORT.md, SECTION_7_RESTAURANT_ADMIN_REPORT.md  
**Estimated Time**: 1-2 hours

#### Problem
Multiple files have type mismatches where `theme` is expected to be an object but is treated as a string:
- `dinner-hero.tsx`: `theme.primaryColor` fails when theme is string
- `dinner-card.tsx`: Same issue
- `restaurant-form.tsx`: Theme handling inconsistent

#### Root Cause
The database schema stores theme as JSON, but TypeScript types don't match:

```typescript
// Database returns this:
theme: { primaryColor: "#FF5733", secondaryColor: "#333" }

// But code expects this:
theme: "modern" // string
```

#### Technical Solution

**Step 1**: Fix theme type definition

File: `packages/shared/src/schemas/restaurant.schema.ts`

```typescript
import { z } from "zod";

// Theme object schema
export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  fontFamily: z.string().optional(),
});

export type Theme = z.infer<typeof themeSchema>;

// Restaurant schema with correct theme type
export const restaurantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  theme: themeSchema, // Object, not string
  logoUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  ownerId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Restaurant = z.infer<typeof restaurantSchema>;
```

**Step 2**: Update dinner-hero component

File: `apps/web/src/app/(core)/dinner/[id]/components/dinner-hero.tsx`

```typescript
import Image from "next/image";
import { Restaurant } from "@repo/shared/schemas";

interface DinnerHeroProps {
  restaurant: Restaurant;
  coverImage?: string;
}

export default function DinnerHero({ restaurant, coverImage }: DinnerHeroProps) {
  // Safely access theme colors with fallbacks
  const primaryColor = restaurant.theme?.primaryColor || "#FF5733";
  const secondaryColor = restaurant.theme?.secondaryColor || "#333333";

  return (
    <div className="relative h-64 w-full">
      {coverImage ? (
        <Image
          src={coverImage}
          alt={restaurant.name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          }}
        >
          <h1 className="text-4xl font-bold text-white">{restaurant.name}</h1>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Restaurant name overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          {restaurant.name}
        </h1>
      </div>
    </div>
  );
}
```

**Step 3**: Update dinner-card component

File: `apps/web/src/app/(core)/discover/components/dinner-card.tsx`

```typescript
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatDate } from "@repo/shared/utils";

interface DinnerCardProps {
  dinner: {
    id: string;
    title: string;
    description: string;
    scheduledAt: Date;
    price: number;
    availableSeats: number;
    restaurant: {
      name: string;
      theme: {
        primaryColor: string;
        secondaryColor: string;
      };
      coverImageUrl?: string;
    };
  };
}

export default function DinnerCard({ dinner }: DinnerCardProps) {
  const primaryColor = dinner.restaurant.theme?.primaryColor || "#FF5733";

  return (
    <Link href={`/dinner/${dinner.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
        {/* Image or gradient */}
        <div className="relative h-48 w-full">
          {dinner.restaurant.coverImageUrl ? (
            <Image
              src={dinner.restaurant.coverImageUrl}
              alt={dinner.title}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{dinner.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {dinner.description}
          </p>

          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-gray-500">
              {formatDate(dinner.scheduledAt)}
            </span>
            <span className="font-semibold" style={{ color: primaryColor }}>
              {formatCurrency(dinner.price)}
            </span>
          </div>

          <div className="text-xs text-gray-500">
            {dinner.availableSeats} seats available
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Step 4**: Update restaurant form

File: `apps/web/src/app/admin/restaurant/components/restaurant-form.tsx`

Ensure theme is handled as object:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurant } from "../actions";
import { Restaurant } from "@repo/shared/schemas";

interface RestaurantFormProps {
  restaurant: Restaurant;
}

export default function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with theme object
  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    cuisine: restaurant.cuisine || "",
    address: restaurant.address,
    phone: restaurant.phone || "",
    email: restaurant.email || "",
    website: restaurant.website || "",
    primaryColor: restaurant.theme?.primaryColor || "#FF5733",
    secondaryColor: restaurant.theme?.secondaryColor || "#333333",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateRestaurant(restaurant.id, {
        ...formData,
        theme: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
        },
      });

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic fields */}
      <div>
        <label className="block text-sm font-medium mb-1">Restaurant Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>

      {/* Theme colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) =>
              setFormData({ ...formData, primaryColor: e.target.value })
            }
            className="w-full h-10 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Secondary Color</label>
          <input
            type="color"
            value={formData.secondaryColor}
            onChange={(e) =>
              setFormData({ ...formData, secondaryColor: e.target.value })
            }
            className="w-full h-10 rounded-lg"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
```

#### Verification Steps
1. Run TypeScript compiler: `npm run type-check`
2. Verify no theme-related type errors
3. Test restaurant form saves theme correctly
4. Check dinner cards display with correct colors
5. Verify dinner hero uses theme colors

#### Success Criteria
- ✅ No TypeScript errors related to theme
- ✅ Theme colors display correctly in UI
- ✅ Restaurant form saves theme as object
- ✅ All components handle theme consistently

---

### 🟠 HIGH-3: Implement QR Code Display UI
**Priority**: HIGH - Check-in feature incomplete  
**Impact**: Users cannot see QR codes for check-in  
**Source**: SECTION_17_QR_CHECKIN_REPORT.md  
**Estimated Time**: 2-3 hours

#### Problem
QR code generation backend exists, but no UI to display QR codes to users. Users need to see their QR code to check in at dinners.

#### Technical Solution

**Step 1**: Install QR code library

```bash
npm install qrcode --workspace=apps/web
npm install -D @types/qrcode --workspace=apps/web
```

**Step 2**: Create QR code display component

File: `apps/web/src/app/(core)/my-dinners/components/qr-code-display.tsx` (NEW FILE)

```typescript
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  seatId: string;
  dinnerId: string;
  dinnerTitle: string;
  scheduledAt: Date;
}

export default function QRCodeDisplay({
  seatId,
  dinnerId,
  dinnerTitle,
  scheduledAt,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Fetch QR token from API
        const response = await fetch(`/api/seats/${seatId}/qr-token`);
        
        if (!response.ok) {
          throw new Error("Failed to generate QR code");
        }

        const data = await response.json();
        const qrToken = data.token;
        setToken(qrToken);

        // Generate QR code image
        const checkInUrl = `${window.location.origin}/dinner/${dinnerId}/check-in?token=${qrToken}`;
        const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        setQrCodeUrl(qrDataUrl);
      } catch (err) {
        console.error("QR code generation error:", err);
        setError("Failed to generate QR code");
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [seatId, dinnerId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Your Check-In QR Code</h3>
        <p className="text-sm text-gray-600">{dinnerTitle}</p>
        <p className="text-xs text-gray-500">
          {new Date(scheduledAt).toLocaleDateString()} at{" "}
          {new Date(scheduledAt).toLocaleTimeString()}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <img
          src={qrCodeUrl}
          alt="Check-in QR Code"
          className="w-64 h-64 border-4 border-gray-200 rounded-lg"
        />
      </div>

      {/* Instructions */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-700">
          Show this QR code to the restaurant staff to check in
        </p>
        <p className="text-xs text-gray-500">
          This code is valid for 24 hours before the dinner
        </p>
      </div>

      {/* Token display (for debugging) */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer">Show token</summary>
        <code className="block mt-2 p-2 bg-gray-100 rounded break-all">
          {token}
        </code>
      </details>
    </div>
  );
}
```

**Step 3**: Create QR token API endpoint

File: `apps/web/src/app/api/seats/[seatId]/qr-token/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { generateQRToken } from "@repo/shared/utils/qr-token";
import { handleApiError } from "@/app/api/lib/error-handler";

export async function GET(
  req: NextRequest,
  { params }: { params: { seatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seatId = params.seatId;

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get seat and verify ownership
    const seat = await db.seat.findUnique({
      where: { id: seatId },
      include: {
        dinner: true,
      },
    });

    if (!seat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (seat.userId !== user.id) {
      return NextResponse.json(
        { error: "This seat does not belong to you" },
        { status: 403 }
      );
    }

    // Only generate QR for confirmed seats
    if (seat.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Seat must be confirmed to generate QR code" },
        { status: 400 }
      );
    }

    // Generate QR token
    const token = generateQRToken(seatId, seat.dinnerId, user.id);

    return NextResponse.json({
      success: true,
      token,
      seatId,
      dinnerId: seat.dinnerId,
      expiresAt: new Date(
        seat.dinner.scheduledAt.getTime() + 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("QR token generation error:", error);
    return handleApiError(error);
  }
}
```

**Step 4**: Add QR code to user dinner card

File: `apps/web/src/app/(core)/my-dinners/components/user-dinner-card.tsx`

Add a "Show QR Code" button that opens a modal:

```typescript
"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@repo/shared/utils";
import QRCodeDisplay from "./qr-code-display";

interface UserDinnerCardProps {
  dinner: {
    id: string;
    title: string;
    scheduledAt: Date;
    price: number;
    restaurant: {
      name: string;
    };
    seat: {
      id: string;
      status: string;
    };
  };
}

export default function UserDinnerCard({ dinner }: UserDinnerCardProps) {
  const [showQR, setShowQR] = useState(false);

  const isUpcoming = new Date(dinner.scheduledAt) > new Date();
  const isConfirmed = dinner.seat.status === "CONFIRMED";

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{dinner.title}</h3>
            <p className="text-sm text-gray-600">{dinner.restaurant.name}</p>
          </div>
          <StatusBadge status={dinner.seat.status} />
        </div>

        <div className="text-sm text-gray-600">
          <p>{formatDate(dinner.scheduledAt)}</p>
          <p>{formatCurrency(dinner.price)}</p>
        </div>

        {/* Show QR button for confirmed upcoming dinners */}
        {isUpcoming && isConfirmed && (
          <button
            onClick={() => setShowQR(true)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Show QR Code
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQR(false)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeDisplay
              seatId={dinner.seat.id}
              dinnerId={dinner.id}
              dinnerTitle={dinner.title}
              scheduledAt={dinner.scheduledAt}
            />
            <button
              onClick={() => setShowQR(false)}
              className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    CONFIRMED: "bg-green-100 text-green-800",
    HELD: "bg-yellow-100 text-yellow-800",
    CHECKED_IN: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
        styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
}
```

#### Verification Steps
1. Book a dinner and confirm it
2. Go to "My Dinners" page
3. Click "Show QR Code" button
4. Verify QR code displays correctly
5. Test scanning QR code with phone
6. Verify check-in works with QR code

#### Success Criteria
- ✅ QR code displays for confirmed bookings
- ✅ QR code is scannable
- ✅ Check-in works via QR code
- ✅ Token expires after 24 hours
- ✅ Only seat owner can generate QR code

---

### 🟠 HIGH-4: Implement Email Notification System
**Priority**: HIGH - Critical for user communication  
**Impact**: Users don't receive booking confirmations or updates  
**Source**: SECTION_3_SEAT_STATE_MACHINE_REPORT.md, MVP_CRITICAL_FIXES_SPEC.md  
**Estimated Time**: 3-4 hours

#### Problem
No email notification system implemented. Users need emails for:
- Booking confirmation
- Payment receipt
- Dinner reminders
- Cancellation notifications
- Check-in confirmations

#### Technical Solution

**Step 1**: Install Resend email service

```bash
npm install resend --workspace=packages/email
```

**Step 2**: Create email package

File: `packages/email/package.json` (NEW FILE)

```json
{
  "name": "@repo/email",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "resend": "^3.0.0"
  }
}
```

**Step 3**: Create email service

File: `packages/email/src/index.ts` (NEW FILE)

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "DineWithMe <noreply@dinewithme.com>";

export interface BookingConfirmationEmail {
  to: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  scheduledAt: Date;
  price: number;
  seatId: string;
  dinnerId: string;
}

export interface DinnerReminderEmail {
  to: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  scheduledAt: Date;
  address: string;
  seatId: string;
}

export interface CancellationEmail {
  to: string;
  userName: string;
  dinnerTitle: string;
  restaurantName: string;
  scheduledAt: Date;
  refundAmount?: number;
}

export const emailService = {
  async sendBookingConfirmation(data: BookingConfirmationEmail) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.to,
        subject: `Booking Confirmed: ${data.dinnerTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Booking Confirmed! 🎉</h1>
            
            <p>Hi ${data.userName},</p>
            
            <p>Your booking has been confirmed for:</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">${data.dinnerTitle}</h2>
              <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
              <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
              <p><strong>Price:</strong> R${(data.price / 100).toFixed(2)}</p>
            </div>
            
            <p>You can view your booking and QR code in the app:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-dinners" 
               style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              View My Bookings
            </a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Booking ID: ${data.seatId}<br>
              Dinner ID: ${data.dinnerId}
            </p>
            
            <p style="color: #666; font-size: 14px;">
              See you at the dinner!<br>
              The DineWithMe Team
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Email send error:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error };
    }
  },

  async sendDinnerReminder(data: DinnerReminderEmail) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.to,
        subject: `Reminder: ${data.dinnerTitle} is tomorrow!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Dinner Reminder 🍽️</h1>
            
            <p>Hi ${data.userName},</p>
            
            <p>This is a friendly reminder that your dinner is coming up soon!</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">${data.dinnerTitle}</h2>
              <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
              <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
              <p><strong>Address:</strong> ${data.address}</p>
            </div>
            
            <p>Don't forget to bring your QR code for check-in!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-dinners" 
               style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              View QR Code
            </a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Looking forward to seeing you!<br>
              The DineWithMe Team
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Email send error:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error };
    }
  },

  async sendCancellationEmail(data: CancellationEmail) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: data.to,
        subject: `Booking Cancelled: ${data.dinnerTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Booking Cancelled</h1>
            
            <p>Hi ${data.userName},</p>
            
            <p>Your booking has been cancelled for:</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">${data.dinnerTitle}</h2>
              <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
              <p><strong>Date & Time:</strong> ${new Date(data.scheduledAt).toLocaleString()}</p>
              ${data.refundAmount ? `<p><strong>Refund Amount:</strong> R${(data.refundAmount / 100).toFixed(2)}</p>` : ""}
            </div>
            
            ${data.refundAmount ? "<p>Your refund will be processed within 5-10 business days.</p>" : ""}
            
            <p>We hope to see you at another dinner soon!</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/discover" 
               style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
              Browse Dinners
            </a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              The DineWithMe Team
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("Email send error:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Email service error:", error);
      return { success: false, error };
    }
  },
};
```

**Step 4**: Integrate emails into seat state machine

File: `packages/db/src/services/seat-state-machine.ts`

Add email notifications to state transitions:

```typescript
import { emailService } from "@repo/email";

// In confirmSeat function, after successful confirmation:
async confirmSeat(seatId: string, userId: string) {
  // ... existing confirmation logic ...

  // Send confirmation email
  const user = await this.db.user.findUnique({ where: { id: userId } });
  const seat = await this.db.seat.findUnique({
    where: { id: seatId },
    include: {
      dinner: {
        include: { restaurant: true },
      },
    },
  });

  if (user && seat) {
    await emailService.sendBookingConfirmation({
      to: user.email,
      userName: user.name || "Guest",
      dinnerTitle: seat.dinner.title,
      restaurantName: seat.dinner.restaurant.name,
      scheduledAt: seat.dinner.scheduledAt,
      price: seat.dinner.price,
      seatId: seat.id,
      dinnerId: seat.dinnerId,
    });
  }

  return confirmedSeat;
}

// In cancelSeat function, after successful cancellation:
async cancelSeat(seatId: string, userId: string, reason?: string) {
  // ... existing cancellation logic ...

  // Send cancellation email
  if (user && seat) {
    await emailService.sendCancellationEmail({
      to: user.email,
      userName: user.name || "Guest",
      dinnerTitle: seat.dinner.title,
      restaurantName: seat.dinner.restaurant.name,
      scheduledAt: seat.dinner.scheduledAt,
      refundAmount: refund?.amount,
    });
  }

  return cancelledSeat;
}
```

**Step 5**: Add environment variable

File: `.env.example`

```bash
# Resend Email Service
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Step 6**: Create reminder cron job

File: `apps/web/src/app/api/cron/send-reminders/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailService } from "@repo/email";

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find dinners happening in 24 hours
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const upcomingDinners = await db.dinner.findMany({
      where: {
        scheduledAt: {
          gte: new Date(),
          lte: tomorrow,
        },
        status: "PUBLISHED",
      },
      include: {
        restaurant: true,
        seats: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            user: true,
          },
        },
      },
    });

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const dinner of upcomingDinners) {
      for (const seat of dinner.seats) {
        const result = await emailService.sendDinnerReminder({
          to: seat.user.email,
          userName: seat.user.name || "Guest",
          dinnerTitle: dinner.title,
          restaurantName: dinner.restaurant.name,
          scheduledAt: dinner.scheduledAt,
          address: dinner.restaurant.address,
          seatId: seat.id,
        });

        if (result.success) {
          emailsSent++;
        } else {
          emailsFailed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      dinnersProcessed: upcomingDinners.length,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Verification Steps
1. Sign up for Resend account (free tier available)
2. Add RESEND_API_KEY to environment variables
3. Complete a booking and verify confirmation email
4. Cancel a booking and verify cancellation email
5. Test reminder cron job manually
6. Set up Vercel cron job for reminders

#### Success Criteria
- ✅ Confirmation emails sent on booking
- ✅ Cancellation emails sent on cancellation
- ✅ Reminder emails sent 24h before dinner
- ✅ Emails are well-formatted and professional
- ✅ All links in emails work correctly

---

### 🟠 HIGH-5: Implement Environment Variable Validation
**Priority**: HIGH - Prevents runtime errors  
**Impact**: App crashes if required env vars missing  
**Source**: SECTION_16_CONFIG_ENVIRONMENT_REPORT.md  
**Estimated Time**: 1-2 hours

#### Problem
No validation of required environment variables at startup. App can start with missing credentials and fail at runtime.

#### Technical Solution

**Step 1**: Create environment validation utility

File: `packages/config/src/env-validator.ts` (NEW FILE)

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL"),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1, "PAYSTACK_SECRET_KEY is required"),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is required"),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Email (optional in development)
  RESEND_API_KEY: z.string().optional(),

  // Cron (required in production)
  CRON_SECRET: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional production checks
    if (env.NODE_ENV === "production") {
      if (!env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is required in production");
      }
      if (!env.CRON_SECRET) {
        throw new Error("CRON_SECRET is required in production");
      }
      if (env.DATABASE_URL.includes("localhost")) {
        console.warn("⚠️  WARNING: Using localhost database in production");
      }
    }

    console.log("✅ Environment variables validated successfully");
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid environment variables");
    }
    throw error;
  }
}

// Export validated env
export const env = validateEnv();
```

**Step 2**: Validate on app startup

File: `apps/web/src/app/layout.tsx`

Add validation at the top:

```typescript
import { validateEnv } from "@repo/config/env-validator";

// Validate environment variables on startup
if (typeof window === "undefined") {
  validateEnv();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 3**: Create startup check script

File: `scripts/check-env.ts` (NEW FILE)

```typescript
#!/usr/bin/env node

import { validateEnv } from "../packages/config/src/env-validator";

console.log("🔍 Checking environment variables...\n");

try {
  const env = validateEnv();
  
  console.log("\n✅ All required environment variables are set!");
  console.log("\nConfiguration:");
  console.log(`  - Environment: ${env.NODE_ENV}`);
  console.log(`  - App URL: ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(`  - Database: ${env.DATABASE_URL.split("@")[1] || "configured"}`);
  console.log(`  - Auth: Clerk (${env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...)`);
  console.log(`  - Storage: Cloudflare R2 (${env.R2_BUCKET_NAME})`);
  console.log(`  - Payment: Paystack (${env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.substring(0, 20)}...)`);
  console.log(`  - Email: ${env.RESEND_API_KEY ? "Resend configured" : "Not configured"}`);
  console.log(`  - Analytics: ${env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? "Google Analytics configured" : "Not configured"}`);
  
  process.exit(0);
} catch (error) {
  console.error("\n❌ Environment check failed!");
  console.error("\nPlease check your .env file and ensure all required variables are set.");
  console.error("See .env.example for reference.\n");
  process.exit(1);
}
```

**Step 4**: Add check to package.json

File: `package.json`

```json
{
  "scripts": {
    "check:env": "tsx scripts/check-env.ts",
    "dev": "npm run check:env && turbo dev",
    "build": "npm run check:env && turbo build",
    "start": "turbo start"
  }
}
```

**Step 5**: Create deployment checklist

File: `docs/DEPLOYMENT_CHECKLIST.md` (NEW FILE)

```markdown
# Production Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
- [ ] All required env vars set in production
- [ ] Run `npm run check:env` successfully
- [ ] No placeholder values in production env
- [ ] Database URL points to production database
- [ ] All API keys are production keys (not test keys)

### 2. Database
- [ ] Run migrations: `npm run db:push`
- [ ] Verify database connection
- [ ] Seed initial data if needed
- [ ] Set up database backups

### 3. External Services
- [ ] Clerk: Production instance configured
- [ ] Cloudflare R2: Bucket created and accessible
- [ ] Paystack: Production keys configured
- [ ] Resend: Domain verified and API key set
- [ ] Google Analytics: Tracking ID configured (optional)

### 4. Security
- [ ] Rotate any exposed credentials
- [ ] Set CRON_SECRET for cron job authentication
- [ ] Enable HTTPS only
- [ ] Set secure cookie settings
- [ ] Review CORS settings

### 5. Code Quality
- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful
- [ ] Test critical user flows manually

## Deployment

### 1. Deploy to Vercel
```bash
vercel --prod
```

### 2. Set Environment Variables
- Go to Vercel Dashboard → Project → Settings → Environment Variables
- Add all production environment variables
- Redeploy after adding env vars

### 3. Set Up Cron Jobs
- Go to Vercel Dashboard → Project → Settings → Cron Jobs
- Add cron job for seat expiration: `*/5 * * * *` → `/api/cron/expire-holds`
- Add cron job for dinner reminders: `0 9 * * *` → `/api/cron/send-reminders`
- Add cron job for dinner completion: `0 * * * *` → `/api/cron/complete-dinners`

### 4. Configure Domain
- Add custom domain in Vercel
- Update NEXT_PUBLIC_APP_URL to production domain
- Update Clerk allowed origins
- Update Paystack webhook URL

## Post-Deployment

### 1. Smoke Tests
- [ ] Sign up new user
- [ ] Browse dinners
- [ ] Book a free dinner
- [ ] Book a paid dinner
- [ ] View QR code
- [ ] Cancel booking
- [ ] Check email notifications

### 2. Monitoring
- [ ] Check Vercel logs for errors
- [ ] Monitor database connections
- [ ] Verify cron jobs running
- [ ] Check email delivery

### 3. Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Monitor API response times
- [ ] Verify image optimization

## Rollback Plan

If issues occur:
1. Revert to previous deployment in Vercel
2. Check logs for error details
3. Fix issues in development
4. Re-deploy after testing

## Support

- Vercel Dashboard: https://vercel.com/dashboard
- Clerk Dashboard: https://dashboard.clerk.com
- Paystack Dashboard: https://dashboard.paystack.com
- Cloudflare Dashboard: https://dash.cloudflare.com
```

#### Verification Steps
1. Run `npm run check:env` in development
2. Test with missing env var (should fail gracefully)
3. Test with invalid env var (should show clear error)
4. Verify production checks work correctly

#### Success Criteria
- ✅ Environment validation runs on startup
- ✅ Clear error messages for missing variables
- ✅ Production-specific checks work
- ✅ Deployment checklist created

---

## 🟡 PHASE 3: MEDIUM PRIORITY IMPROVEMENTS (Day 4-5)
### Important but Not Blocking

### 🟡 MEDIUM-1: Add Client-Side Form Validation
**Priority**: MEDIUM - Improves UX  
**Impact**: Better user experience, fewer failed submissions  
**Source**: SECTION_15_ERROR_VALIDATION_REPORT.md  
**Estimated Time**: 3-4 hours

#### Problem
Forms only validate on server-side. Users don't see errors until after submission.

#### Technical Solution

**Step 1**: Install react-hook-form and Zod resolver

```bash
npm install react-hook-form @hookform/resolvers --workspace=apps/web
```

**Step 2**: Update restaurant form with client validation

File: `apps/web/src/app/admin/restaurant/components/restaurant-form.tsx`

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { restaurantSchema } from "@repo/shared/schemas";
import { z } from "zod";

const formSchema = restaurantSchema.pick({
  name: true,
  description: true,
  cuisine: true,
  address: true,
  phone: true,
  email: true,
  website: true,
}).extend({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
});

type FormData = z.infer<typeof formSchema>;

export default function RestaurantForm({ restaurant }: { restaurant: any }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description || "",
      cuisine: restaurant.cuisine || "",
      address: restaurant.address,
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      website: restaurant.website || "",
      primaryColor: restaurant.theme?.primaryColor || "#FF5733",
      secondaryColor: restaurant.theme?.secondaryColor || "#333333",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Submit logic
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">
          Restaurant Name *
        </label>
        <input
          {...register("name")}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address *</label>
        <input
          {...register("address")}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.address && (
          <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border rounded-lg"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
```

**Step 3**: Apply to all major forms
- Dinner creation form
- Restaurant settings form
- Profile update form

#### Success Criteria
- ✅ Forms show validation errors before submission
- ✅ Error messages are clear and helpful
- ✅ Forms prevent invalid submissions

---

### 🟡 MEDIUM-2: Fix Admin Navigation Issues
**Priority**: MEDIUM - Admin UX improvement  
**Impact**: Admins have difficulty navigating  
**Source**: SECTION_14_NAVIGATION_ROUTING_REPORT.md  
**Estimated Time**: 2 hours

#### Problem
Admin sidebar navigation has inconsistent active states and missing links.

#### Technical Solution

File: `apps/web/src/app/admin/components/admin-sidebar.tsx`

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/restaurant", label: "Restaurant", icon: "🏪" },
  { href: "/admin/dinners", label: "Dinners", icon: "🍽️" },
  { href: "/admin/ops/restaurants", label: "All Restaurants", icon: "🏢" },
  { href: "/admin/ops/users", label: "Users", icon: "👥" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

#### Success Criteria
- ✅ Active nav item highlighted correctly
- ✅ All admin pages accessible
- ✅ Navigation is intuitive

---

### 🟡 MEDIUM-3: Add Toast Notifications
**Priority**: MEDIUM - Better user feedback  
**Impact**: Users get immediate feedback on actions  
**Source**: SECTION_15_ERROR_VALIDATION_REPORT.md  
**Estimated Time**: 1-2 hours

#### Technical Solution

**Step 1**: Install react-hot-toast

```bash
npm install react-hot-toast --workspace=apps/web
```

**Step 2**: Add to root layout

File: `apps/web/src/app/layout.tsx`

```typescript
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
```

**Step 3**: Use in components

```typescript
import toast from "react-hot-toast";

// Success
toast.success("Booking confirmed!");

// Error
toast.error("Failed to book dinner");

// Loading
const toastId = toast.loading("Processing...");
// Later:
toast.success("Done!", { id: toastId });
```

#### Success Criteria
- ✅ Toast notifications appear for all actions
- ✅ Success/error states clearly indicated
- ✅ Toasts auto-dismiss after appropriate time

---

### 🟡 MEDIUM-4: Add Global Error Boundary
**Priority**: MEDIUM - Better error handling  
**Impact**: Graceful error recovery  
**Source**: SECTION_15_ERROR_VALIDATION_REPORT.md  
**Estimated Time**: 1 hour

#### Technical Solution

File: `apps/web/src/app/error.tsx` (NEW FILE)

```typescript
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
```

File: `apps/web/src/app/global-error.tsx` (NEW FILE)

```typescript
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Application Error</h2>
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

#### Success Criteria
- ✅ Errors caught gracefully
- ✅ User-friendly error messages
- ✅ Reset functionality works

---

### 🟡 MEDIUM-5: Create Analytics Dashboard
**Priority**: MEDIUM - Business insights  
**Impact**: Restaurant owners can track performance  
**Source**: SECTION_12_ANALYTICS_TRACKING_REPORT.md  
**Estimated Time**: 4-5 hours

#### Problem
Analytics data is collected but no dashboard to view it.

#### Technical Solution

File: `apps/web/src/app/admin/analytics/page.tsx` (NEW FILE)

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PageHeader from "@/app/(core)/components/page-header";

export default async function AnalyticsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { restaurant: true },
  });

  if (!user?.restaurant) {
    return <div>No restaurant found</div>;
  }

  // Get analytics for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const analytics = await db.analytics.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      OR: [
        { restaurantId: user.restaurant.id },
        {
          dinner: {
            restaurantId: user.restaurant.id,
          },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate metrics
  const totalViews = analytics.filter((a) => a.eventType === "dinner_viewed").length;
  const totalBookings = analytics.filter((a) => a.eventType === "booking_confirmed").length;
  const totalRevenue = await db.paymentIntent.aggregate({
    where: {
      status: "SUCCEEDED",
      seat: {
        dinner: {
          restaurantId: user.restaurant.id,
        },
      },
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { amount: true },
  });

  const conversionRate = totalViews > 0 ? ((totalBookings / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PageHeader title="Analytics Dashboard" />

      <div className="max-w-6xl mx-auto mt-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Views"
            value={totalViews}
            icon="👁️"
            trend="+12%"
          />
          <MetricCard
            title="Bookings"
            value={totalBookings}
            icon="🎫"
            trend="+8%"
          />
          <MetricCard
            title="Revenue"
            value={`R${((totalRevenue._sum.amount || 0) / 100).toFixed(2)}`}
            icon="💰"
            trend="+15%"
          />
          <MetricCard
            title="Conversion"
            value={`${conversionRate}%`}
            icon="📈"
            trend="+2%"
          />
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {analytics.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex justify-between items-center py-2 border-b"
              >
                <div>
                  <span className="font-medium">{formatEventType(event.eventType)}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  trend: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-green-600">{trend}</div>
    </div>
  );
}

function formatEventType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

#### Success Criteria
- ✅ Dashboard shows key metrics
- ✅ Recent activity displayed
- ✅ Data updates in real-time
- ✅ Restaurant-specific filtering works

---

### 🟡 MEDIUM-6: Optimize Database Queries
**Priority**: MEDIUM - Performance improvement  
**Impact**: Faster page loads  
**Source**: SECTION_2_DATABASE_REPORT.md  
**Estimated Time**: 2-3 hours

#### Technical Solution

**Step 1**: Add database indexes

File: `packages/db/prisma/schema.prisma`

Add indexes to frequently queried fields:

```prisma
model Dinner {
  id            String   @id @default(uuid())
  restaurantId  String
  scheduledAt   DateTime
  status        DinnerStatus
  
  @@index([restaurantId])
  @@index([scheduledAt])
  @@index([status])
  @@index([restaurantId, status, scheduledAt])
}

model Seat {
  id        String     @id @default(uuid())
  dinnerId  String
  userId    String?
  status    SeatStatus
  
  @@index([dinnerId])
  @@index([userId])
  @@index([status])
  @@index([dinnerId, status])
}

model Analytics {
  id          String   @id @default(uuid())
  eventType   String
  userId      String?
  dinnerId    String?
  restaurantId String?
  createdAt   DateTime @default(now())
  
  @@index([eventType])
  @@index([userId])
  @@index([dinnerId])
  @@index([restaurantId])
  @@index([createdAt])
}
```

**Step 2**: Push schema changes

```bash
npm run db:push
```

**Step 3**: Optimize discover page query

File: `apps/web/src/app/(core)/discover/page.tsx`

```typescript
// Before: N+1 query problem
const dinners = await db.dinner.findMany({
  include: {
    restaurant: true,
    seats: true, // Loads ALL seats
  },
});

// After: Optimized with select and aggregate
const dinners = await db.dinner.findMany({
  where: {
    status: "PUBLISHED",
    scheduledAt: { gte: new Date() },
  },
  select: {
    id: true,
    title: true,
    description: true,
    scheduledAt: true,
    price: true,
    maxSeats: true,
    restaurant: {
      select: {
        name: true,
        theme: true,
        coverImageUrl: true,
      },
    },
    _count: {
      select: {
        seats: {
          where: { status: "AVAILABLE" },
        },
      },
    },
  },
  orderBy: { scheduledAt: "asc" },
  take: 50, // Limit results
});
```

#### Success Criteria
- ✅ Page load times improved
- ✅ Database query count reduced
- ✅ No N+1 query problems

---

### 🟡 MEDIUM-7: Add Input Sanitization
**Priority**: MEDIUM - Security improvement  
**Impact**: Prevents XSS attacks  
**Source**: SECTION_15_ERROR_VALIDATION_REPORT.md  
**Estimated Time**: 1-2 hours

#### Technical Solution

**Step 1**: Install DOMPurify

```bash
npm install isomorphic-dompurify --workspace=apps/web
```

**Step 2**: Create sanitization utility

File: `packages/shared/src/utils/sanitize.ts` (NEW FILE)

```typescript
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(text: string): string {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}
```

**Step 3**: Apply to user inputs

Use in API routes before saving to database:

```typescript
import { sanitizeText, sanitizeHtml } from "@repo/shared/utils/sanitize";

const sanitizedData = {
  title: sanitizeText(data.title),
  description: sanitizeHtml(data.description),
  website: sanitizeUrl(data.website),
};
```

#### Success Criteria
- ✅ All user inputs sanitized
- ✅ XSS attacks prevented
- ✅ URLs validated

---

## 🟢 PHASE 4: POLISH & OPTIMIZATION (Day 6-7)
### Nice to Have, Can Deploy Without

### 🟢 LOW-1: Add Loading States and Skeletons
**Priority**: LOW - UX polish  
**Impact**: Better perceived performance  
**Source**: Multiple section reports  
**Estimated Time**: 2-3 hours

#### Technical Solution

Ensure all pages have loading.tsx files with skeleton screens:

File: `apps/web/src/app/(core)/discover/loading.tsx`

```typescript
import DinnerListSkeleton from "./components/dinner-list-skeleton";

export default function Loading() {
  return <DinnerListSkeleton />;
}
```

Apply to all major pages:
- `/discover/loading.tsx` ✅ (exists)
- `/my-dinners/loading.tsx` ✅ (exists)
- `/dinner/[id]/loading.tsx` (create)
- `/admin/dinners/loading.tsx` (create)

---

### 🟢 LOW-2: Implement Search Functionality
**Priority**: LOW - Feature enhancement  
**Impact**: Users can find dinners faster  
**Source**: WIREFRAMES_IMPLEMENTATION_ANALYSIS.md  
**Estimated Time**: 3-4 hours

#### Technical Solution

File: `apps/web/src/app/(core)/discover/components/dinner-search.tsx` (NEW FILE)

```typescript
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DinnerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    router.push(`/discover?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dinners..."
          className="w-full px-4 py-3 pl-10 border rounded-lg"
        />
        <span className="absolute left-3 top-3 text-gray-400">🔍</span>
      </div>
    </form>
  );
}
```

Update discover page to handle search:

```typescript
const searchQuery = searchParams.get("q");

const dinners = await db.dinner.findMany({
  where: {
    status: "PUBLISHED",
    scheduledAt: { gte: new Date() },
    ...(searchQuery && {
      OR: [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
        { restaurant: { name: { contains: searchQuery, mode: "insensitive" } } },
      ],
    }),
  },
});
```

---

### 🟢 LOW-3: Add Seat Selection UI
**Priority**: LOW - Optional feature  
**Impact**: Users can choose specific seats  
**Source**: WIREFRAMES_IMPLEMENTATION_ANALYSIS.md  
**Estimated Time**: 4-5 hours

#### Note
This is marked as optional in the wireframes analysis. The current flow (automatic seat assignment) works fine for MVP. Can be added post-launch if users request it.

---

### 🟢 LOW-4: Implement Settings Page
**Priority**: LOW - User preference management  
**Impact**: Users can manage preferences  
**Source**: WIREFRAMES_IMPLEMENTATION_ANALYSIS.md  
**Estimated Time**: 2-3 hours

#### Technical Solution

File: `apps/web/src/app/(core)/settings/page.tsx` (NEW FILE)

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PageHeader from "../components/page-header";

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Settings" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Email notifications</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Dinner reminders</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Marketing emails</span>
              <input type="checkbox" className="toggle" />
            </label>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Privacy</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span>Show profile to other diners</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span>Allow connection requests</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <button className="text-red-600 hover:text-red-700">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 🟢 LOW-5: Add Error Monitoring Service
**Priority**: LOW - Production monitoring  
**Impact**: Better error tracking  
**Source**: SECTION_15_ERROR_VALIDATION_REPORT.md  
**Estimated Time**: 1-2 hours

#### Technical Solution

**Option 1: Sentry (Recommended)**

```bash
npm install @sentry/nextjs --workspace=apps/web
```

File: `sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Option 2: LogRocket**

```bash
npm install logrocket --workspace=apps/web
```

---

### 🟢 LOW-6: Performance Optimizations
**Priority**: LOW - Speed improvements  
**Impact**: Faster load times  
**Source**: Best practices  
**Estimated Time**: 2-3 hours

#### Technical Solution

**1. Enable Next.js Image Optimization**

Already using `next/image` - ensure all images use it.

**2. Add Caching Headers**

File: `next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};
```

**3. Enable Compression**

Vercel handles this automatically.

**4. Lazy Load Components**

```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <p>Loading...</p>,
});
```

---

## 📊 IMPLEMENTATION SUMMARY

### Priority Matrix

| Phase | Priority | Issues | Est. Time | Can Deploy Without? |
|-------|----------|--------|-----------|---------------------|
| Phase 1 | 🔴 CRITICAL | 2 | 1-2 days | ❌ NO - Blocks revenue |
| Phase 2 | 🟠 HIGH | 5 | 2-3 days | ⚠️ NOT RECOMMENDED |
| Phase 3 | 🟡 MEDIUM | 7 | 2-3 days | ✅ YES - But impacts UX |
| Phase 4 | 🟢 LOW | 6 | 2-3 days | ✅ YES - Polish only |

### Total Estimated Timeline

- **Minimum Viable**: 3-5 days (Phase 1 + Phase 2)
- **Recommended**: 7-10 days (Phase 1 + Phase 2 + Phase 3)
- **Complete**: 10-14 days (All phases)

### Critical Path

```
Day 1-2: CRITICAL BLOCKERS
├── Fix booking confirmation flow (3h)
└── Remove exposed credentials (30m)

Day 2-3: HIGH PRIORITY
├── Implement payment UI (4-6h)
├── Fix theme type errors (1-2h)
├── Implement QR code display (2-3h)
├── Implement email notifications (3-4h)
└── Environment validation (1-2h)

Day 4-5: MEDIUM PRIORITY
├── Client-side form validation (3-4h)
├── Fix admin navigation (2h)
├── Add toast notifications (1-2h)
├── Global error boundary (1h)
├── Analytics dashboard (4-5h)
├── Optimize database queries (2-3h)
└── Input sanitization (1-2h)

Day 6-7: POLISH
├── Loading states (2-3h)
├── Search functionality (3-4h)
├── Settings page (2-3h)
├── Error monitoring (1-2h)
└── Performance optimizations (2-3h)
```

---

## 🎯 RECOMMENDED DEPLOYMENT STRATEGY

### Option A: Fast Track (3-5 days)
**Goal**: Get to production ASAP with core functionality

**Include**:
- ✅ Phase 1: Critical Blockers (MUST)
- ✅ Phase 2: High Priority (MUST)
- ⚠️ Phase 3: Skip for now
- ⚠️ Phase 4: Skip for now

**Deploy with**:
- Working booking flow
- Secure credentials
- Payment processing
- QR code check-in
- Email notifications
- Basic error handling

**Known limitations**:
- No client-side form validation
- No analytics dashboard
- No search functionality
- Basic error messages

---

### Option B: Recommended (7-10 days)
**Goal**: Production-ready with good UX

**Include**:
- ✅ Phase 1: Critical Blockers
- ✅ Phase 2: High Priority
- ✅ Phase 3: Medium Priority
- ⚠️ Phase 4: Skip for now

**Deploy with**:
- All core features working
- Good user experience
- Professional error handling
- Analytics for business insights
- Optimized performance

**Known limitations**:
- No search (can add later)
- No settings page (can add later)
- No error monitoring service

---

### Option C: Complete (10-14 days)
**Goal**: Fully polished production app

**Include**:
- ✅ Phase 1: Critical Blockers
- ✅ Phase 2: High Priority
- ✅ Phase 3: Medium Priority
- ✅ Phase 4: Polish & Optimization

**Deploy with**:
- Everything working perfectly
- All features implemented
- Excellent UX
- Production monitoring
- Optimized performance

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment (Do First)

- [ ] Complete Phase 1 (Critical Blockers)
- [ ] Complete Phase 2 (High Priority)
- [ ] Run `npm run type-check` - no errors
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - successful
- [ ] Test all critical user flows manually
- [ ] Rotate exposed credentials
- [ ] Set up production environment variables

### Deployment Steps

1. **Set up external services**
   - [ ] Create production Clerk instance
   - [ ] Create Cloudflare R2 bucket
   - [ ] Set up Paystack production account
   - [ ] Set up Resend email service
   - [ ] Create production database (Neon/Supabase)

2. **Configure Vercel**
   - [ ] Connect GitHub repository
   - [ ] Add all environment variables
   - [ ] Configure custom domain
   - [ ] Set up cron jobs

3. **Database setup**
   - [ ] Run migrations: `npm run db:push`
   - [ ] Verify database connection
   - [ ] Seed initial data if needed

4. **Deploy**
   - [ ] Deploy to Vercel: `vercel --prod`
   - [ ] Verify deployment successful
   - [ ] Check all environment variables loaded

### Post-Deployment Testing

- [ ] Sign up new user
- [ ] Browse dinners
- [ ] Book free dinner
- [ ] Book paid dinner (test payment)
- [ ] View QR code
- [ ] Cancel booking
- [ ] Check email notifications received
- [ ] Test admin panel
- [ ] Create new dinner as admin
- [ ] Verify analytics tracking

### Monitoring

- [ ] Check Vercel logs for errors
- [ ] Monitor database connections
- [ ] Verify cron jobs running
- [ ] Check email delivery rates
- [ ] Monitor payment processing
- [ ] Track user signups

---

## 🔧 TECHNICAL IMPLEMENTATION NOTES

### Key Architecture Decisions

1. **Booking Flow**: Use `/api/seats/hold` → Payment → `/api/seats/[seatId]/confirm`
2. **Theme Storage**: Store as JSON object with `{ primaryColor, secondaryColor }`
3. **QR Codes**: Generate server-side tokens, display client-side with qrcode library
4. **Emails**: Use Resend for transactional emails
5. **Validation**: Zod schemas on both client and server
6. **Error Handling**: Centralized error handler + global error boundary
7. **Analytics**: Track events in database, display in admin dashboard

### Database Indexes to Add

```prisma
@@index([restaurantId])
@@index([scheduledAt])
@@index([status])
@@index([dinnerId, status])
@@index([userId])
@@index([eventType])
@@index([createdAt])
```

### Environment Variables Required

```bash
# Core (Required)
DATABASE_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
NEXT_PUBLIC_APP_URL

# Email (Required in production)
RESEND_API_KEY

# Cron (Required in production)
CRON_SECRET

# Optional
NEXT_PUBLIC_GA_MEASUREMENT_ID
SENTRY_DSN
```

### Cron Jobs to Configure

1. **Expire Held Seats**: `*/5 * * * *` → `/api/cron/expire-holds`
2. **Send Reminders**: `0 9 * * *` → `/api/cron/send-reminders`
3. **Complete Dinners**: `0 * * * *` → `/api/cron/complete-dinners`

---

## 📝 IMPLEMENTATION ORDER

### Day 1: Critical Blockers

**Morning (4 hours)**
1. Fix booking confirmation flow
   - Create `/api/seats/[seatId]/confirm` endpoint
   - Update `confirmation-content.tsx`
   - Update `dinner-cta.tsx`
   - Delete deprecated `/api/seats/confirm`
   - Test booking flow end-to-end

**Afternoon (2 hours)**
2. Security fixes
   - Sanitize all `.env.example` files
   - Rotate exposed credentials
   - Create environment setup documentation
   - Verify `.gitignore` correct

### Day 2: High Priority Part 1

**Morning (4 hours)**
3. Payment UI
   - Create `/api/payments/verify` endpoint
   - Create payment history page
   - Add payment link to navigation
   - Test payment flow

**Afternoon (3 hours)**
4. Fix theme type errors
   - Update `restaurant.schema.ts`
   - Fix `dinner-hero.tsx`
   - Fix `dinner-card.tsx`
   - Fix `restaurant-form.tsx`
   - Run type-check

### Day 3: High Priority Part 2

**Morning (4 hours)**
5. QR code display
   - Install qrcode library
   - Create `qr-code-display.tsx`
   - Create `/api/seats/[seatId]/qr-token` endpoint
   - Update `user-dinner-card.tsx`
   - Test QR generation and scanning

**Afternoon (4 hours)**
6. Email notifications
   - Install Resend
   - Create email package
   - Implement email templates
   - Integrate into state machine
   - Create reminder cron job
   - Test all email types

### Day 4: High Priority Part 3 + Medium Priority

**Morning (2 hours)**
7. Environment validation
   - Create `env-validator.ts`
   - Add validation to app startup
   - Create check script
   - Create deployment checklist

**Afternoon (5 hours)**
8. Client-side validation
   - Install react-hook-form
   - Update restaurant form
   - Update dinner form
   - Test validation

9. Admin navigation
   - Fix sidebar active states
   - Add missing links

10. Toast notifications
    - Install react-hot-toast
    - Add to root layout
    - Apply to all actions

### Day 5: Medium Priority Continued

**Full Day (7 hours)**
11. Global error boundary
    - Create error.tsx
    - Create global-error.tsx

12. Analytics dashboard
    - Create analytics page
    - Calculate metrics
    - Display charts

13. Database optimization
    - Add indexes
    - Optimize queries
    - Test performance

14. Input sanitization
    - Install DOMPurify
    - Create sanitization utils
    - Apply to all inputs

### Day 6-7: Polish (Optional)

**As time permits**
15. Loading states
16. Search functionality
17. Settings page
18. Error monitoring
19. Performance optimizations

---

## ✅ SUCCESS CRITERIA

### Must Have (Phase 1 + 2)
- ✅ Users can book dinners successfully
- ✅ Payment processing works end-to-end
- ✅ QR codes display and work for check-in
- ✅ Email notifications sent for all events
- ✅ No security vulnerabilities
- ✅ No TypeScript errors
- ✅ App builds successfully
- ✅ All critical user flows tested

### Should Have (Phase 3)
- ✅ Forms validate on client-side
- ✅ Admin navigation works smoothly
- ✅ Toast notifications for all actions
- ✅ Error boundary catches errors gracefully
- ✅ Analytics dashboard shows metrics
- ✅ Database queries optimized
- ✅ User inputs sanitized

### Nice to Have (Phase 4)
- ✅ Loading states on all pages
- ✅ Search functionality works
- ✅ Settings page implemented
- ✅ Error monitoring configured
- ✅ Performance optimized

---

## 🎉 CONCLUSION

This plan provides a comprehensive roadmap to take DineWithMe from its current state (95% complete backend) to a production-ready application. The backend architecture is excellent and requires minimal changes. Most work is frontend UI completion and polish.

**Key Insights**:
- Backend is production-ready (Grade A+)
- 2 critical blockers must be fixed immediately
- 5 high-priority items needed for good UX
- Medium and low priority items can be added post-launch

**Recommended Approach**:
1. Fix critical blockers (Day 1-2)
2. Complete high priority items (Day 2-3)
3. Add medium priority improvements (Day 4-5)
4. Deploy to production
5. Add polish items post-launch based on user feedback

**Timeline**: 7-10 days for recommended deployment, 3-5 days for fast track.

---

**Document Version**: 1.0  
**Last Updated**: March 7, 2026  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 1 - Critical Blockers

