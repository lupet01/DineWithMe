# DineWithMe

A Next.js TypeScript monorepo for connecting people over meals.

> **Start here**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (how it's built), [docs/STATUS.md](docs/STATUS.md) (what's actually true right now), [docs/DECISIONS.md](docs/DECISIONS.md) (why things are the way they are). Everything else in `docs/` is either a still-relevant guide or historical record — see [docs/README.md](docs/README.md) for the full index.

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Development](#development)
- [Architecture](#architecture)

---

## Project Structure

```
dinewithme/
├── apps/
│   └── web/                 # Next.js App Router application
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── lib/         # Utilities and helpers
│       │   └── features/    # Feature-based modules
│       └── .env             # Environment variables
├── packages/
│   ├── db/                  # Database layer (Prisma + Repositories)
│   ├── analytics/           # Analytics utilities (PostHog)
│   ├── shared/              # Shared utilities, types, and RBAC
│   ├── config/              # Shared configuration
│   ├── payment/             # Payment integration (Paystack)
│   └── storage/             # File storage (Cloudflare R2)
├── prisma/                  # Prisma schema and migrations
├── scripts/                 # Utility scripts (organized by category)
│   ├── admin/               # User role and admin management
│   ├── database/            # Database maintenance scripts
│   └── seed/                # Data seeding and migration
├── tests/                   # Test scripts for manual testing
└── docs/                    # Documentation (organized by category)
    ├── epics/               # Epic completion documentation
    ├── guides/              # Setup and how-to guides
    ├── fixes/               # Bug fixes and troubleshooting
    └── references/          # Reference docs and checklists
```

---

## Tech Stack

### Core
- **Next.js 14** - App Router with Server Components
- **TypeScript** - Strict mode for type safety
- **Tailwind CSS** - Utility-first styling
- **Turbo** - Monorepo orchestration

### Database
- **PostgreSQL** - Primary database
- **Prisma** - ORM and migrations
- **Repository Pattern** - Data access abstraction

### Authentication
- **Clerk** - Authentication provider
- **Role-Based Access Control** - Custom RBAC implementation

### Analytics
- **PostHog** - Product analytics (optional)

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

---

## Local Setup

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ running locally
- **Git** for version control

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd DineWithMe
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Database

```bash
# Create PostgreSQL database
createdb dinewithme

# Or using psql
psql -U postgres
CREATE DATABASE dinewithme;
\q
```

### Step 4: Configure Environment Variables

Copy the example environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` with your values (see [Environment Variables](#environment-variables) section).

### Step 5: Run Database Migrations

```bash
cd apps/web
npx prisma db push --schema=../../prisma/schema.prisma
npx prisma generate --schema=../../prisma/schema.prisma
```

### Step 6: Start Development Server

```bash
# From project root
npm run dev
```

The app will be available at http://localhost:3001 (or 3000 if available).

### Step 7: Create Admin User

1. Sign up at http://localhost:3001/sign-up with your email
2. Visit http://localhost:3001/dashboard to sync your profile
3. Promote yourself to admin:

```bash
# From project root
.\scripts\admin\setup-admin-user.ps1
```

---

## Environment Variables

### Required Variables

Create `apps/web/.env` with the following:

```bash
# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dinewithme?schema=public

# Clerk Authentication
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Platform Admin (for seed script)
PLATFORM_ADMIN_EMAIL=your-email@example.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Optional Variables

```bash
# Analytics (PostHog)
POSTHOG_API_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_ANALYTICS_KEY=your-public-key
```

### Environment Files

- `apps/web/.env` - Main environment file (gitignored)
- `apps/web/.env.local` - Local overrides (gitignored, takes precedence)
- `apps/web/.env.example` - Example template (committed to git)

### Getting Clerk Keys

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy the publishable key and secret key
4. Add to `apps/web/.env`

---

## Database Migrations

### Running Migrations

```bash
# Push schema changes to database
cd apps/web
npx prisma db push --schema=../../prisma/schema.prisma

# Generate Prisma client
npx prisma generate --schema=../../prisma/schema.prisma
```

### Creating Migrations

```bash
# Create a new migration
cd apps/web
npx prisma migrate dev --schema=../../prisma/schema.prisma --name your_migration_name
```

### Viewing Database

```bash
# Open Prisma Studio
cd apps/web
npx prisma studio --schema=../../prisma/schema.prisma
```

### Database Schema

Current schema includes:

- **User** - User accounts with authentication
  - `id` - Unique identifier (CUID)
  - `authProviderId` - Clerk user ID
  - `email` - User email (unique)
  - `firstName`, `lastName` - User name
  - `avatarUrl` - Profile picture
  - `role` - User role (DINER, RESTAURANT_ADMIN, PLATFORM_ADMIN)
  - `status` - Account status
  - `createdAt`, `updatedAt` - Timestamps

### Troubleshooting

**Issue: Permission error when generating Prisma client**

Solution: Stop the dev server before running `prisma generate`:

```bash
# Stop dev server (Ctrl+C)
# Then run:
.\scripts\database\fix-prisma-generate.ps1
```

**Issue: Database connection error**

Solution: Verify PostgreSQL is running and credentials are correct:

```bash
psql -U postgres -d dinewithme
```

---

## Authentication

### How Authentication Works

DineWithMe uses **Clerk** for authentication with a custom database sync layer.

#### Authentication Flow

```
1. User signs up/in via Clerk
   ↓
2. Clerk handles authentication
   ↓
3. User redirected to dashboard
   ↓
4. Dashboard triggers /api/auth/sync
   ↓
5. Sync endpoint:
   - Verifies Clerk session
   - Reads user profile from Clerk
   - Upserts user in database
   - Emits analytics events
   ↓
6. User record created with role=DINER
```

#### Key Components

**Clerk Integration:**
- `ClerkProvider` wraps the app
- `auth()` and `currentUser()` for server components
- `useAuth()` and `useUser()` for client components

**Database Sync:**
- `/api/auth/sync` - Syncs Clerk user to database
- Triggered on dashboard load
- Creates/updates user record

**Auth Helpers:**
- `getAuthUser()` - Get user with role from database
- `requireAuth()` - Require authentication for pages
- `requireRole()` - Require specific role(s)

### Protected Routes

**Middleware Protection** (`apps/web/src/middleware.ts`):
- Public: `/`, `/sign-in`, `/sign-up`
- Authenticated: `/app/*`, `/dashboard`
- Admin: `/admin/*` (RESTAURANT_ADMIN or PLATFORM_ADMIN)

**API Protection** (`apps/web/src/lib/auth.ts`):
- `requireAuth()` - Require authentication
- `requireRole([roles])` - Require specific role(s)

### Session Management

- Sessions managed by Clerk
- Automatic token refresh
- Secure cookie-based storage
- No manual session handling required

For detailed authentication documentation, see [docs/references/auth.md](docs/references/auth.md).

---

## Role-Based Access Control

### Roles

DineWithMe implements a three-tier role system:

| Role | Description | Permissions |
|------|-------------|-------------|
| **DINER** | Default role for all users | View restaurants, create/join dinners, manage own profile |
| **RESTAURANT_ADMIN** | Restaurant owners/managers | All DINER permissions + manage restaurants, view analytics |
| **PLATFORM_ADMIN** | System administrators | All permissions + manage users, assign roles, platform settings |

### Role Assignment

**Default Role:**
- All new users get `DINER` role automatically

**Promoting to Admin:**
```bash
# Set admin email in apps/web/.env
PLATFORM_ADMIN_EMAIL=your-email@example.com

# Sign in to the app first
# Then run:
.\scripts\admin\setup-admin-user.ps1
```

**Manual Role Change:**
```sql
-- Connect to database
psql -U postgres -d dinewithme

-- Update user role
UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'user@example.com';
```

### Permission Checks

**In Server Components:**
```typescript
import { getAuthUser } from "@/lib/auth-helpers";
import { canAccessAdmin } from "@dinewithme/shared";

const user = await getAuthUser();
if (canAccessAdmin(user)) {
  // Show admin features
}
```

**In API Routes:**
```typescript
import { requireRole } from "@/lib/auth";
import { Role } from "@dinewithme/shared";

const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
if (isErrorResponse(authResult)) {
  return authResult.error;
}
```

**In Middleware:**
- Automatically checks role for `/admin/*` routes
- Redirects unauthorized users to `/app/unauthorized`

### RBAC Helpers

Located in `packages/shared/src/rbac/`:

- `canAccessAdmin(user)` - Check admin access
- `canAccessRestaurantPortal(user)` - Check restaurant admin access
- `canPerform(action, user)` - Check specific action permission
- `getUserPermissions(user)` - Get all user permissions

### Permission Matrix

See `packages/shared/src/rbac/permissions.ts` for the complete permission matrix.

---

## Development

### Package Scripts

```bash
# Development
npm run dev              # Start all dev servers
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run format           # Format code with Prettier
npm run type-check       # Type check all packages

# Database
npm run seed             # Run database seed script

# Utilities
npm run clean            # Clean build artifacts
```

### Project Commands

```bash
# Clear Next.js cache
.\scripts\database\clear-cache-and-restart.ps1

# Fix Prisma generation issues
.\scripts\database\fix-prisma-generate.ps1

# Promote user to admin
.\scripts\admin\setup-admin-user.ps1

# Test database connection
.\scripts\database\test-database.ps1

# Seed themes
npx tsx scripts/seed/seed-themes.ts

# Seed dinners
npx tsx scripts/seed/seed-dinners.ts
```

### Code Organization

**Feature-Based Structure:**
```
apps/web/src/features/
├── auth/           # Authentication features
├── users/          # User management
├── dinners/        # Dinner features
├── restaurants/    # Restaurant features
└── ...
```

**Each feature contains:**
- `components/` - React components
- `services.ts` - Business logic
- `types.ts` - TypeScript types
- `index.ts` - Public exports

### Styling

**Apple-Native Design System:**
- Slate color palette
- Generous spacing (8-unit grid)
- Rounded corners (rounded-2xl)
- Subtle shadows
- Smooth transitions

See `EPIC_1.6_STYLING_NOTES.md` for complete styling guide.

---

## Architecture

### Monorepo Structure

**Turborepo Benefits:**
- Fast, cached builds
- Parallel task execution
- Workspace-based dependencies
- Shared configuration

### Package Organization

**`@dinewithme/db`** - Database Layer
- Prisma client
- Repository pattern
- Type-safe queries
- No direct Prisma usage in routes

**`@dinewithme/shared`** - Shared Utilities
- Zod validation schemas
- TypeScript types
- RBAC helpers
- Common utilities

**`@dinewithme/analytics`** - Analytics
- Event tracking
- PostHog integration
- Type-safe events
- Server-side only events

**`@dinewithme/config`** - Configuration
- Environment validation
- Shared constants
- Type-safe config

### Design Patterns

**Repository Pattern:**
- Abstracts database access
- Consistent API
- Easy to test
- Swappable data sources

**Server Components:**
- Default for all pages
- Better performance
- SEO-friendly
- Reduced client bundle

**API Route Protection:**
- Consistent error responses
- Request correlation logging
- Analytics tracking
- Type-safe auth checks

---

## Documentation

### Quick Links
- [Documentation Index](docs/README.md) - Complete documentation index
- [Architecture Breakdown](docs/references/ARCHITECTURE_BREAKDOWN.md) - System architecture
- [Authentication Guide](docs/references/auth.md) - Detailed auth documentation
- [Test Scripts](tests/README.md) - Manual testing guide
- [Utility Scripts](scripts/README.md) - Database and admin scripts

### Guides
- [Database Setup](docs/guides/DATABASE_SETUP.md)
- [Admin Setup](docs/guides/ADMIN_SETUP_GUIDE.md)
- [Cloudflare R2 Setup](docs/guides/CLOUDFLARE_R2_SETUP.md)
- [GitHub Actions Setup](docs/guides/GITHUB_ACTIONS_SETUP.md)

### References
- [Seat Lifecycle](docs/references/SEAT_LIFECYCLE_REFERENCE.md)
- [State Machine](docs/references/state-machine.md)
- [Background Jobs](docs/references/jobs.md)
- [Test Checklist](docs/references/TEST_CHECKLIST.md)
- [Troubleshooting](docs/references/TROUBLESHOOTING.md)

### Project Status
- [Current Status](docs/references/CURRENT_STATUS.md)
- [Progress Summary](docs/references/PROGRESS_SUMMARY.md)
- [TODO List](docs/references/TODO.md)

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write meaningful commit messages

### Testing

- Test authentication flows
- Verify role-based access
- Check responsive design
- Test keyboard navigation

### Pull Requests

- Create feature branches
- Write clear descriptions
- Include tests
- Update documentation

---

## License

[Your License Here]

---

## Support

For issues or questions:
- Create a GitHub issue
- Contact: support@dinewithme.com

---

Built with ❤️ using Next.js, TypeScript, and Prisma
