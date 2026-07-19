# API Routes

Next.js App Router API routes for DineWithMe.

## Structure

```
api/
├── users/
│   ├── route.ts           # GET /api/users, POST /api/users
│   └── [id]/
│       └── route.ts       # GET /api/users/:id, PATCH /api/users/:id, DELETE /api/users/:id
├── lib/
│   ├── error-handler.ts   # Centralized error handling
│   └── middleware.ts      # Reusable middleware (CORS, auth, rate limiting)
└── README.md
```

## Route Pattern

Every route follows this pattern:

1. Validate input with Zod schemas
2. Call repository layer (no direct Prisma usage)
3. Emit analytics events
4. Return standardized response
5. Handle errors with centralized error handler

## Example Route

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate input
    const validation = validate(createUserSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 2. Call repository
    const user = await userRepository.create(validation.data);

    // 3. Emit analytics
    await track(AnalyticsEvents.USER_CREATED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // 4. Return response
    return NextResponse.json(
      { success: true, data: user },
      { status: 201 }
    );
  } catch (error) {
    // 5. Handle errors
    return handleApiError(error);
  }
}
```

## Response Format

All responses follow this structure:

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Error Handling

The `handleApiError` function handles:
- Prisma errors (unique constraints, not found, foreign keys)
- Validation errors
- Generic errors

## Middleware

Available middleware in `lib/middleware.ts`:
- `withCors` - CORS headers
- `withAuth` - Authentication (stub)
- `withRateLimit` - Rate limiting (stub)

## Adding New Routes

1. Create route folder: `api/[domain]/`
2. Add `route.ts` with HTTP methods
3. Validate with Zod schemas from `@dinewithme/shared`
4. Use repositories from `@dinewithme/db`
5. Track events with `@dinewithme/analytics`
6. Use `handleApiError` for error handling
