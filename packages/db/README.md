# @dinewithme/db

Database layer for DineWithMe using Prisma and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and configure your database URL:
```bash
cp .env.example .env
```

2. Generate Prisma client:
```bash
npm run db:generate
```

3. Push schema to database:
```bash
npm run db:push
```

## Usage

Always use repositories, never import Prisma client directly:

```typescript
import { userRepository } from "@dinewithme/db";

// Find user by email
const user = await userRepository.findByEmail("user@example.com");

// Create user
const newUser = await userRepository.create({
  email: "user@example.com",
});

// Update user
const updated = await userRepository.update(user.id, {
  email: "newemail@example.com",
});
```

## Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Architecture

- `client.ts` - Prisma singleton with connection pooling
- `repositories/` - Repository pattern for data access
- `repositories/base.ts` - Abstract base repository
- All database access goes through repositories
