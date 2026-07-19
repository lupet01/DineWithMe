# @dinewithme/shared

Shared types, schemas, and utilities for DineWithMe.

## Features

- Zod schemas for runtime validation
- TypeScript types for compile-time safety
- Validation utilities
- API response types

## Usage

### Validation with Zod

```typescript
import { createUserSchema, validate } from "@dinewithme/shared";

// Validate input
const result = validate(createUserSchema, {
  email: "user@example.com",
});

if (result.success) {
  console.log(result.data.email);
} else {
  console.error(result.error);
}
```

### Type-safe API Inputs

```typescript
import { CreateUserInput, UpdateUserInput } from "@dinewithme/shared";

function createUser(input: CreateUserInput) {
  // input.email is type-safe
}
```

### API Responses

```typescript
import { ApiResponse, UserResponse } from "@dinewithme/shared";

const response: ApiResponse<UserResponse> = {
  success: true,
  data: {
    id: "123",
    email: "user@example.com",
    createdAt: new Date().toISOString(),
  },
};
```

## Structure

- `types/` - TypeScript type definitions
- `schemas/` - Zod validation schemas
- `utils/` - Shared utilities
