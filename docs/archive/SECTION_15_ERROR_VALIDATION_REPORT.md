# SECTION 15: Error Handling & Validation - System Review Report

**Review Date**: March 5, 2026  
**Reviewer**: Kiro AI  
**Status**: ✅ COMPLETE  
**Overall Grade**: B+

---

## Executive Summary

The error handling and validation system is well-structured with centralized error handling, comprehensive Zod schemas, and consistent error responses. The system properly validates input on both client and server sides, though there are opportunities to improve client-side validation with form libraries.

### Key Strengths:
- ✅ Centralized error handler for API routes
- ✅ Comprehensive Zod validation schemas
- ✅ Consistent error response format
- ✅ Proper Prisma error handling
- ✅ User-friendly error messages
- ✅ Field-level error display
- ✅ Analytics tracking for errors

### Issues Found:
- 🟡 MEDIUM: No client-side form validation library (react-hook-form)
- 🟡 MEDIUM: Inconsistent validation patterns (parse vs safeParse)
- 🟢 LOW: Some error messages could be more specific
- 🟢 LOW: No global error boundary for client components
- 🟢 LOW: Limited input sanitization

---

## 1. Centralized Error Handler

### Implementation

**File**: `apps/web/src/app/api/lib/error-handler.ts`


**Purpose**: Centralized error handling for all API routes

**Strengths**:
- ✅ Handles Prisma-specific errors
- ✅ Consistent error response format
- ✅ Proper HTTP status codes
- ✅ Detailed error logging
- ✅ User-friendly error messages

**Error Types Handled**:

1. **Unique Constraint Violation (P2002)**
   ```typescript
   if (error.code === "P2002") {
     return NextResponse.json({
       success: false,
       error: {
         message: "A record with this value already exists",
         code: "DUPLICATE_ENTRY",
         details: error.meta,
       },
     }, { status: 409 });
   }
   ```
   - Status: 409 Conflict
   - Includes metadata about which field violated constraint

2. **Record Not Found (P2025)**
   ```typescript
   if (error.code === "P2025") {
     return NextResponse.json({
       success: false,
       error: {
         message: "Record not found",
         code: "NOT_FOUND",
       },
     }, { status: 404 });
   }
   ```
   - Status: 404 Not Found
   - Clear message for missing records

3. **Foreign Key Constraint (P2003)**
   ```typescript
   if (error.code === "P2003") {
     return NextResponse.json({
       success: false,
       error: {
         message: "Invalid reference to related record",
         code: "INVALID_REFERENCE",
       },
     }, { status: 400 });
   }
   ```
   - Status: 400 Bad Request
   - Indicates invalid relationship

4. **Validation Error**
   ```typescript
   if (error instanceof Prisma.PrismaClientValidationError) {
     return NextResponse.json({
       success: false,
       error: {
         message: "Invalid data provided",
         code: "VALIDATION_ERROR",
       },
     }, { status: 400 });
   }
   ```
   - Status: 400 Bad Request
   - Generic validation error

5. **Generic Error**
   ```typescript
   return NextResponse.json({
     success: false,
     error: {
       message: "An unexpected error occurred",
       code: "INTERNAL_ERROR",
     },
   }, { status: 500 });
   ```
   - Status: 500 Internal Server Error
   - Fallback for unknown errors

**Error Response Format**:
```typescript
{
  success: false,
  error: {
    message: string,
    code: string,
    details?: any
  }
}
```

**Consistent across all API routes** ✅


---

## 2. Validation Schemas

### Zod Schema Organization

**Location**: `packages/shared/src/schemas/`

**Files**:
- `user.schema.ts` - User validation
- `restaurant.schema.ts` - Restaurant validation
- `dinner.schema.ts` - Dinner validation
- `seat.schema.ts` - Seat validation
- `feedback.schema.ts` - Feedback validation
- `index.ts` - Exports all schemas

**Strengths**:
- ✅ Centralized in shared package
- ✅ Type-safe with TypeScript inference
- ✅ Reusable across frontend and backend
- ✅ Clear validation rules
- ✅ Custom error messages

---

### Dinner Schema

**File**: `packages/shared/src/schemas/dinner.schema.ts`

**Create Dinner Validation**:
```typescript
export const createDinnerSchema = z.object({
  restaurantId: z.string().cuid("Invalid restaurant ID format"),
  startsAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "Start time must be in the future",
  }),
  endsAt: z.coerce.date(),
  theme: z.string().min(1, "Theme is required").optional(),
  description: z.string().optional(),
  seatCount: z.number().int().min(1, "Must have at least 1 seat").max(100, "Maximum 100 seats"),
}).refine((data) => data.endsAt > data.startsAt, {
  message: "End time must be after start time",
  path: ["endsAt"],
});
```

**Validation Rules**:
- ✅ CUID format validation for IDs
- ✅ Date coercion and future date check
- ✅ Cross-field validation (endsAt > startsAt)
- ✅ Range validation (1-100 seats)
- ✅ Custom error messages
- ✅ Optional fields handled correctly

**Update Dinner Validation**:
```typescript
export const updateDinnerSchema = z.object({
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  theme: z.string().min(1, "Theme is required").optional(),
  description: z.string().optional(),
  seatCount: z.number().int().min(1).max(100).optional(),
  status: dinnerStatusSchema.optional(),
}).refine((data) => {
  if (data.startsAt && data.endsAt) {
    return data.endsAt > data.startsAt;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endsAt"],
});
```

**Strengths**:
- ✅ All fields optional for partial updates
- ✅ Conditional cross-field validation
- ✅ Maintains same validation rules as create

---

### Restaurant Schema

**File**: `packages/shared/src/schemas/restaurant.schema.ts`

**Create Restaurant Validation**:
```typescript
export const createRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  heroImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});
```

**Validation Rules**:
- ✅ Required name field
- ✅ URL validation for website and images
- ✅ Latitude/longitude range validation
- ✅ Allows empty string for optional URLs
- ✅ Clear error messages


---

### Seat Schema

**File**: `packages/shared/src/schemas/seat.schema.ts`

**Hold Seat Validation**:
```typescript
export const holdSeatForDinnerSchema = z.object({
  dinnerId: z.string().cuid("Invalid dinner ID format"),
  holdDurationMinutes: z.number().int().min(1).max(60).optional().default(10),
});
```

**Validation Rules**:
- ✅ CUID format for dinner ID
- ✅ Hold duration range (1-60 minutes)
- ✅ Default value (10 minutes)
- ✅ Integer validation

**Other Seat Schemas**:
```typescript
export const confirmSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});

export const cancelSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});

export const checkInSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});
```

**Strengths**:
- ✅ Simple, focused schemas
- ✅ Consistent ID validation
- ✅ Clear purpose for each schema

---

### Feedback Schema

**File**: `packages/shared/src/schemas/feedback.schema.ts`

**Create Feedback Validation**:
```typescript
export const createFeedbackSchema = z.object({
  dinnerId: z.string().cuid("Invalid dinner ID format"),
  targetUserId: z.string().cuid("Invalid user ID format").nullable().optional(),
  overallSentiment: feedbackSentimentSchema,
  comfortLevel: comfortLevelSchema,
  wouldDineAgain: z.boolean().nullable().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").nullable().optional(),
});
```

**Validation Rules**:
- ✅ Enum validation for sentiment and comfort
- ✅ Max length for notes (1000 chars)
- ✅ Nullable optional fields
- ✅ CUID validation for IDs

**Enums**:
```typescript
export const feedbackSentimentSchema = z.enum([
  "GREAT",
  "GOOD",
  "NEUTRAL",
  "UNCOMFORTABLE",
]);

export const comfortLevelSchema = z.enum([
  "FULL",
  "MOSTLY",
  "LOW",
]);
```

**Strengths**:
- ✅ Type-safe enums
- ✅ Clear sentiment levels
- ✅ Matches database schema

---

### User Schema

**File**: `packages/shared/src/schemas/user.schema.ts`

**Create User Validation**:
```typescript
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
});
```

**Strengths**:
- ✅ Email format validation
- ✅ Simple and focused
- ✅ Clear error message

**Note**: User schema is minimal because most user data comes from Clerk.


---

## 3. API Route Validation Patterns

### Pattern 1: safeParse with Error Response

**Used in**: Most API routes

**Example** (`apps/web/src/app/api/seats/hold/route.ts`):
```typescript
const body = await request.json();
const validation = holdSeatForDinnerSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json({
    success: false,
    error: {
      message: "Invalid request data",
      code: "VALIDATION_ERROR",
      details: validation.error.errors,
    },
  }, { status: 400 });
}

const { dinnerId, holdDurationMinutes } = validation.data;
```

**Strengths**:
- ✅ Doesn't throw, returns result object
- ✅ Includes detailed error information
- ✅ Type-safe access to validated data
- ✅ Consistent error response format

**Used in**:
- `/api/seats/hold` ✅
- `/api/uploads/sign` ✅
- `/api/feedback/submit` ✅

---

### Pattern 2: parse with Try-Catch

**Used in**: Some API routes

**Example** (`apps/web/src/app/api/seats/check-in/route.ts`):
```typescript
try {
  const body = await request.json();
  const validatedData = checkInSchema.parse(body);
  
  // Use validatedData...
} catch (error) {
  return handleApiError(error);
}
```

**Strengths**:
- ✅ Throws on validation error
- ✅ Caught by error handler
- ✅ Simpler code when you want to throw

**Used in**:
- `/api/seats/check-in` ✅
- `/api/seats/cancel` ✅

---

### Issue: Inconsistent Validation Patterns 🟡 MEDIUM

**Problem**: Mix of `parse()` and `safeParse()` patterns

**Impact**: 
- Inconsistent error handling
- Different error response formats
- Harder to maintain

**Recommendation**: Standardize on `safeParse()` for all API routes

**Reason**:
- More explicit error handling
- Consistent error responses
- Better control over error format
- Includes detailed validation errors

**Example Fix**:
```typescript
// Before (parse)
try {
  const validatedData = checkInSchema.parse(body);
  // ...
} catch (error) {
  return handleApiError(error);
}

// After (safeParse)
const validation = checkInSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json({
    success: false,
    error: {
      message: "Invalid request data",
      code: "VALIDATION_ERROR",
      details: validation.error.errors,
    },
  }, { status: 400 });
}

const validatedData = validation.data;
```


---

## 4. Client-Side Validation

### Current Implementation

**Pattern**: Manual state management with React hooks

**Example** (`apps/web/src/app/admin/restaurant/components/restaurant-form.tsx`):
```typescript
const [error, setError] = useState<string | null>(null);
const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setFieldErrors({});

  startTransition(async () => {
    const result = await createRestaurant(formData);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    }
  });
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  
  // Clear field error when user starts typing
  if (fieldErrors[name]) {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }
};
```

**Strengths**:
- ✅ Clears errors on user input
- ✅ Displays field-level errors
- ✅ Shows general error message
- ✅ Uses React transitions

**Weaknesses**:
- ❌ No client-side validation before submit
- ❌ Manual state management
- ❌ Repetitive code across forms
- ❌ No schema reuse from server

---

### Issue: No Client-Side Form Validation Library 🟡 MEDIUM

**Problem**: Forms don't validate on the client before submission

**Impact**:
- Poor UX (wait for server response to see errors)
- Unnecessary API calls for invalid data
- Inconsistent validation between client and server
- More boilerplate code

**Recommendation**: Implement react-hook-form with Zod resolver

**Benefits**:
- ✅ Client-side validation before submit
- ✅ Reuse Zod schemas from server
- ✅ Automatic error handling
- ✅ Less boilerplate
- ✅ Better UX with instant feedback

**Example Implementation**:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRestaurantSchema } from "@dinewithme/shared";

export function RestaurantForm({ restaurant, mode }: RestaurantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: restaurant?.name || "",
      description: restaurant?.description || "",
      // ...
    },
  });

  const onSubmit = async (data) => {
    const result = await createRestaurant(data);
    if (result.success) {
      router.refresh();
    } else {
      // Handle server errors
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name")}
        className={errors.name ? "border-red-500" : ""}
      />
      {errors.name && (
        <p className="text-red-500 text-sm">{errors.name.message}</p>
      )}
      {/* ... */}
    </form>
  );
}
```

**Installation**:
```bash
npm install react-hook-form @hookform/resolvers
```


---

## 5. Error Display Patterns

### Pattern 1: Alert Box

**Used in**: Forms and pages

**Example**:
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="text-red-600 text-xl">⚠️</div>
      <div>
        <div className="font-medium text-red-900">Error</div>
        <div className="text-sm text-red-700 mt-1">{error}</div>
      </div>
    </div>
  </div>
)}
```

**Strengths**:
- ✅ Visually prominent
- ✅ Clear error icon
- ✅ Consistent styling
- ✅ Good contrast

**Used in**:
- Restaurant form ✅
- Dinner form ✅
- Theme manager ✅

---

### Pattern 2: Inline Field Error

**Example**:
```typescript
{fieldErrors[name] && (
  <p className="text-sm text-red-600 mt-1">
    {fieldErrors[name][0]}
  </p>
)}
```

**Strengths**:
- ✅ Shows error next to field
- ✅ Clear association
- ✅ Doesn't disrupt layout

**Used in**:
- Restaurant form ✅
- Image upload ✅

---

### Pattern 3: Error Page Component

**Example** (`apps/web/src/app/(core)/dinner/[id]/confirm/components/confirmation-error.tsx`):
```typescript
export function ConfirmationError({ error, onRetry, onBackToDinner }: Props) {
  const isExpiredError = error.includes("expired") || error.includes("Expired");
  const isAlreadyConfirmed = error.includes("already confirmed");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {isExpiredError ? "Hold Expired" : "Confirmation Failed"}
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>

        {/* Context-specific help */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">What can you do?</h3>
          {isExpiredError && (
            <p>Your seat hold has expired. Try booking again...</p>
          )}
          {!isExpiredError && !isAlreadyConfirmed && (
            <p>Check your payment method and try again...</p>
          )}
        </div>

        {/* Action buttons */}
        <button onClick={onRetry}>Try Again</button>
        <button onClick={onBackToDinner}>Back to Dinner</button>
      </div>
    </div>
  );
}
```

**Strengths**:
- ✅ Full-page error state
- ✅ Context-specific messaging
- ✅ Helpful suggestions
- ✅ Clear action buttons
- ✅ Error type detection

**Used in**:
- Confirmation flow ✅
- Feedback flow ✅

---

### Pattern 4: Toast/Notification

**Not currently implemented**

**Recommendation**: Add toast notifications for success/error feedback

**Example with react-hot-toast**:
```typescript
import toast from "react-hot-toast";

const handleSubmit = async (data) => {
  try {
    const result = await createRestaurant(data);
    if (result.success) {
      toast.success("Restaurant created successfully!");
      router.push("/admin/restaurant");
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error("An unexpected error occurred");
  }
};
```


---

## 6. Authentication Error Handling

### Pattern: Early Return with 401

**Example** (`apps/web/src/app/api/seats/hold/route.ts`):
```typescript
const { userId: clerkUserId } = await auth();

if (!clerkUserId) {
  return NextResponse.json({
    success: false,
    error: {
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    },
  }, { status: 401 });
}

const dbUser = await userRepository.findByAuthProviderId(clerkUserId);

if (!dbUser) {
  return NextResponse.json({
    success: false,
    error: {
      message: "User not found in database",
      code: "USER_NOT_FOUND",
    },
  }, { status: 404 });
}
```

**Strengths**:
- ✅ Early return pattern
- ✅ Clear error codes
- ✅ Proper HTTP status codes
- ✅ Consistent across all routes

**Error Codes**:
- `UNAUTHORIZED` - No auth token (401)
- `USER_NOT_FOUND` - User not synced to DB (404)
- `FORBIDDEN` - Insufficient permissions (403)

---

## 7. Authorization Error Handling

### Pattern: Permission Checks

**Example** (`apps/web/src/app/api/uploads/sign/route.ts`):
```typescript
const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);

if (!isOwner) {
  return NextResponse.json({
    success: false,
    error: {
      message: "You do not have permission to upload media for this restaurant",
      code: "FORBIDDEN",
    },
  }, { status: 403 });
}
```

**Strengths**:
- ✅ Clear permission check
- ✅ Descriptive error message
- ✅ Proper 403 status
- ✅ Specific to action

**Used in**:
- Media uploads ✅
- Restaurant updates ✅
- Dinner management ✅

---

## 8. Business Logic Error Handling

### Pattern: Validation Before Action

**Example** (`apps/web/src/app/api/feedback/submit/route.ts`):
```typescript
// Check if dinner exists and is completed
const dinner = await dinnerRepository.findById(body.dinnerId);

if (!dinner) {
  return NextResponse.json({
    success: false,
    error: {
      message: "Dinner not found",
      code: "DINNER_NOT_FOUND",
    },
  }, { status: 404 });
}

if (dinner.status !== "COMPLETED") {
  return NextResponse.json({
    success: false,
    error: {
      message: "Dinner is not completed yet",
      code: "DINNER_NOT_COMPLETED",
    },
  }, { status: 400 });
}

// Check if user attended
const hasEligibleSeat = userSeats.some(
  seat => seat.status === "CONFIRMED" || seat.status === "ATTENDED" || seat.status === "COMPLETED"
);

if (!hasEligibleSeat) {
  return NextResponse.json({
    success: false,
    error: {
      message: "You did not attend this dinner",
      code: "NOT_ATTENDED",
    },
  }, { status: 403 });
}

// Check if already submitted
const hasSubmittedFeedback = await feedbackRepository.hasFeedbackForDinner(
  dbUser.id,
  body.dinnerId
);

if (hasSubmittedFeedback) {
  return NextResponse.json({
    success: false,
    error: {
      message: "You have already submitted feedback for this dinner",
      code: "ALREADY_SUBMITTED",
    },
  }, { status: 400 });
}
```

**Strengths**:
- ✅ Multiple validation checks
- ✅ Specific error codes
- ✅ Clear error messages
- ✅ Proper status codes
- ✅ Business rule enforcement

**Error Codes**:
- `DINNER_NOT_FOUND` - Dinner doesn't exist (404)
- `DINNER_NOT_COMPLETED` - Can't submit feedback yet (400)
- `NOT_ATTENDED` - User didn't attend (403)
- `ALREADY_SUBMITTED` - Duplicate submission (400)


---

## 9. Error Logging

### Console Logging

**Pattern**: Log errors before returning response

**Example**:
```typescript
try {
  // API logic
} catch (error) {
  console.error("[API Error]", error);
  return handleApiError(error);
}
```

**Strengths**:
- ✅ Consistent logging prefix
- ✅ Full error object logged
- ✅ Helps with debugging

**Used in**:
- All API routes ✅
- Error handler ✅

---

### Analytics Error Tracking

**Example** (`apps/web/src/app/api/seats/hold/route.ts`):
```typescript
try {
  const heldSeat = await seatRepository.holdSeatForDinner(
    dbUser.id,
    dinnerId,
    holdDurationMinutes
  );

  await track(AnalyticsEvents.SEAT_HELD_SUCCESS, {
    userId: dbUser.id,
    dinnerId,
    seatId: heldSeat.id,
    timestamp: new Date().toISOString(),
  });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  
  await track(AnalyticsEvents.SEAT_HELD_FAILED, {
    userId: dbUser.id,
    dinnerId,
    reason: errorMessage,
    timestamp: new Date().toISOString(),
  });

  throw error;
}
```

**Strengths**:
- ✅ Tracks both success and failure
- ✅ Includes error reason
- ✅ Helps identify patterns
- ✅ User-specific tracking

**Used in**:
- Seat operations ✅
- Payment operations ✅
- Feedback submission ✅

---

### Issue: No Centralized Error Monitoring 🟢 LOW

**Problem**: No integration with error monitoring service (Sentry, etc.)

**Impact**: 
- Harder to track production errors
- No error aggregation
- No alerting

**Recommendation**: Add Sentry or similar service

**Example**:
```typescript
import * as Sentry from "@sentry/nextjs";

export function handleApiError(error: unknown): NextResponse {
  // Log to Sentry
  Sentry.captureException(error);
  
  console.error("[API Error]", error);
  
  // Return response...
}
```


---

## 10. Issues & Recommendations

### 🟡 MEDIUM Priority Issues

#### Issue 1: No Client-Side Form Validation Library

**Problem**: Forms don't validate on the client before submission.

**Impact**:
- Poor UX (wait for server response)
- Unnecessary API calls
- Inconsistent validation
- More boilerplate code

**Fix**: Implement react-hook-form with Zod resolver

```bash
npm install react-hook-form @hookform/resolvers
```

**Example**:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRestaurantSchema } from "@dinewithme/shared";

export function RestaurantForm({ restaurant, mode }: RestaurantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: restaurant?.name || "",
      description: restaurant?.description || "",
      cuisine: restaurant?.cuisine || "",
      city: restaurant?.city || "",
      address: restaurant?.address || "",
      phone: restaurant?.phone || "",
      website: restaurant?.website || "",
    },
  });

  const onSubmit = async (data: CreateRestaurantInput) => {
    const result = mode === "create"
      ? await createRestaurant(data)
      : await updateRestaurant(restaurant!.id, data);

    if (result.success) {
      router.refresh();
    } else {
      // Handle server errors
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <label htmlFor="name">Restaurant Name</label>
        <input
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      
      {/* Other fields... */}
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

**Benefits**:
- ✅ Instant validation feedback
- ✅ Reuse server schemas
- ✅ Less boilerplate
- ✅ Better UX

---

#### Issue 2: Inconsistent Validation Patterns

**Problem**: Mix of `parse()` and `safeParse()` in API routes.

**Files Affected**:
- `apps/web/src/app/api/seats/check-in/route.ts` (uses parse)
- `apps/web/src/app/api/seats/cancel/route.ts` (uses parse)
- `apps/web/src/app/api/seats/hold/route.ts` (uses safeParse)
- `apps/web/src/app/api/uploads/sign/route.ts` (uses safeParse)
- `apps/web/src/app/api/feedback/submit/route.ts` (uses safeParse)

**Impact**:
- Inconsistent error handling
- Different error response formats
- Harder to maintain

**Fix**: Standardize on `safeParse()` for all routes

**Example**:
```typescript
// Before (parse)
try {
  const validatedData = checkInSchema.parse(body);
  // Use validatedData...
} catch (error) {
  return handleApiError(error);
}

// After (safeParse)
const validation = checkInSchema.safeParse(body);

if (!validation.success) {
  return NextResponse.json({
    success: false,
    error: {
      message: "Invalid request data",
      code: "VALIDATION_ERROR",
      details: validation.error.errors,
    },
  }, { status: 400 });
}

const validatedData = validation.data;
// Use validatedData...
```


---

### 🟢 LOW Priority Issues

#### Issue 3: No Global Error Boundary

**Problem**: No error boundary for client components.

**Impact**: Unhandled errors crash the entire app.

**Fix**: Add error boundary component

**Create** `apps/web/src/components/error-boundary.tsx`:
```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error boundary caught:", error, errorInfo);
    // Log to Sentry here
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-slate-600 mb-6">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage**:
```typescript
// In layout or page
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

#### Issue 4: Limited Input Sanitization

**Problem**: No explicit input sanitization for XSS prevention.

**Impact**: Potential XSS vulnerabilities.

**Fix**: Add input sanitization library

```bash
npm install dompurify
npm install -D @types/dompurify
```

**Example**:
```typescript
import DOMPurify from "dompurify";

// Sanitize user input before storing
const sanitizedNotes = DOMPurify.sanitize(body.notes);
```

**Note**: React already escapes content by default, but explicit sanitization adds extra security for rich text or HTML content.

---

#### Issue 5: Some Error Messages Could Be More Specific

**Problem**: Generic error messages in some places.

**Example**:
```typescript
// Generic
return NextResponse.json({
  success: false,
  error: {
    message: "Invalid data provided",
    code: "VALIDATION_ERROR",
  },
}, { status: 400 });

// Better
return NextResponse.json({
  success: false,
  error: {
    message: "Restaurant name is required and must be at least 1 character",
    code: "VALIDATION_ERROR",
    field: "name",
  },
}, { status: 400 });
```

**Fix**: Include field name and specific validation rule in error messages.

---

#### Issue 6: No Toast Notifications

**Problem**: No toast notifications for success/error feedback.

**Impact**: Less polished UX.

**Fix**: Add react-hot-toast

```bash
npm install react-hot-toast
```

**Setup**:
```typescript
// In root layout
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

**Usage**:
```typescript
import toast from "react-hot-toast";

const handleSubmit = async (data) => {
  try {
    const result = await createRestaurant(data);
    if (result.success) {
      toast.success("Restaurant created successfully!");
      router.push("/admin/restaurant");
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error("An unexpected error occurred");
  }
};
```


---

## 11. Summary

### Overall Assessment: Grade B+

The error handling and validation system is well-structured with centralized error handling, comprehensive Zod schemas, and consistent error responses. The main areas for improvement are client-side validation and consistency in validation patterns.

### Strengths Summary

1. **Centralized Error Handler**: Handles all Prisma errors consistently
2. **Comprehensive Schemas**: Zod schemas for all entities with clear rules
3. **Consistent Error Format**: All API routes return same error structure
4. **Proper HTTP Status Codes**: 400, 401, 403, 404, 409, 500 used correctly
5. **User-Friendly Messages**: Clear, actionable error messages
6. **Field-Level Errors**: Shows errors next to form fields
7. **Analytics Tracking**: Tracks both success and failure events
8. **Business Logic Validation**: Multiple checks before actions
9. **Authentication Errors**: Proper handling of auth failures
10. **Error Display Patterns**: Consistent UI for errors

### Issues Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 0 | None |
| 🟠 High | 0 | None |
| 🟡 Medium | 2 | No client-side validation, inconsistent patterns |
| 🟢 Low | 4 | Error boundary, sanitization, toast, monitoring |
| ✅ Verified | 15 | Core error handling working correctly |

### Required Fixes

1. **Implement react-hook-form with Zod** (🟡 MEDIUM)
2. **Standardize on safeParse()** (🟡 MEDIUM)

### Optional Improvements

1. Add global error boundary (🟢 LOW)
2. Add input sanitization (🟢 LOW)
3. Improve error message specificity (🟢 LOW)
4. Add toast notifications (🟢 LOW)
5. Add error monitoring service (🟢 LOW - Future)

### Verification Checklist

- ✅ Centralized error handler working
- ✅ Zod schemas comprehensive
- ✅ API validation consistent
- ✅ Error responses formatted correctly
- ✅ HTTP status codes correct
- ✅ User-friendly error messages
- ✅ Field-level errors displayed
- ✅ Analytics tracking errors
- ⚠️ No client-side form validation
- ⚠️ Inconsistent parse/safeParse usage
- ⚠️ No global error boundary
- ⚠️ No toast notifications

---

## 12. Error Code Reference

### Authentication Errors (401, 403, 404)

| Code | Message | Status | Meaning |
|------|---------|--------|---------|
| `UNAUTHORIZED` | Unauthorized | 401 | No auth token |
| `USER_NOT_FOUND` | User not found in database | 404 | User not synced |
| `FORBIDDEN` | Permission denied | 403 | Insufficient permissions |

### Validation Errors (400)

| Code | Message | Status | Meaning |
|------|---------|--------|---------|
| `VALIDATION_ERROR` | Invalid request data | 400 | Schema validation failed |
| `INVALID_REFERENCE` | Invalid reference to related record | 400 | Foreign key violation |

### Business Logic Errors (400, 404)

| Code | Message | Status | Meaning |
|------|---------|--------|---------|
| `DINNER_NOT_FOUND` | Dinner not found | 404 | Dinner doesn't exist |
| `DINNER_NOT_COMPLETED` | Dinner is not completed yet | 400 | Can't submit feedback |
| `NOT_ATTENDED` | You did not attend this dinner | 403 | User didn't attend |
| `ALREADY_SUBMITTED` | Already submitted feedback | 400 | Duplicate submission |
| `GALLERY_LIMIT_EXCEEDED` | Maximum of 10 gallery images | 400 | Too many images |

### Database Errors (409, 404)

| Code | Message | Status | Meaning |
|------|---------|--------|---------|
| `DUPLICATE_ENTRY` | Record already exists | 409 | Unique constraint violation |
| `NOT_FOUND` | Record not found | 404 | Prisma P2025 error |

### System Errors (500)

| Code | Message | Status | Meaning |
|------|---------|--------|---------|
| `INTERNAL_ERROR` | An unexpected error occurred | 500 | Unknown error |
| `CONFIGURATION_ERROR` | Configuration missing | 500 | Env var not set |

---

## Next Steps

1. Implement react-hook-form with Zod resolver
2. Standardize all API routes to use safeParse()
3. Add global error boundary
4. Consider adding toast notifications
5. Plan error monitoring service integration

---

**Review Complete**: March 5, 2026  
**Next Section**: Section 16 - Configuration & Environment

