# Architecture

Current-state description of how DineWithMe is built. Unlike the docs in `archive/`, this file is meant to be kept up to date — if you change something structural, update this file in the same PR.

## System shape: one monorepo, one database, three role-gated surfaces

```
apps/web/          Single Next.js app (App Router)
  src/app/
    (core)/           Diner surface  — /discover, /dinner/[id], /my-dinners, /profile
    admin/            Restaurant-owner surface — /admin, /admin/restaurant, /admin/dinners
    admin/ops/        Platform-ops surface — /admin/ops/restaurants (approval queue)
    api/              All API routes (shared by every surface)

packages/
  db/           Prisma client + repository classes (one per domain entity) + seat state machine
  shared/       Zod schemas, shared TS types, cross-cutting utils (e.g. QR token signing)
  config/       Policy constants (cancellation window, check-in window, payment amounts)
  payment/      Paystack client wrapper
  storage/      Cloudflare R2 client (signed uploads)
  analytics/    Typed event tracking (PostHog-backed), event name/payload registry

prisma/schema.prisma   Single source of truth for the data model, one Postgres database
```

All three surfaces share the same database and the same repository layer — there is no per-surface data isolation beyond query filters and role checks. This is a deliberate choice (see "Why one database" below), not an oversight.

## Data model (current)

Core booking domain:
- `User` — `role` is one of `DINER` (default) / `RESTAURANT_ADMIN` / `PLATFORM_ADMIN`. One role per user, no stacking.
- `Restaurant` — owned via `RestaurantMember` (role `OWNER`/`MANAGER`), `status` is `PENDING` → `ACTIVE` (approved by a platform admin) → can be `PAUSED`.
- `Theme` — a reusable "conversation style" (title, description, conversation starters). Enabled per-restaurant via `RestaurantEnabledTheme`.
- `Dinner` — belongs to a restaurant + theme, has `startsAt`/`endsAt`/`seatCount`, status `SCHEDULED` → `LIVE` → `COMPLETED` (or `CANCELLED`).
- `Seat` — one row per bookable spot on a dinner. Status machine: `AVAILABLE` → `HELD` → `CONFIRMED` → `ATTENDED` → `COMPLETED` (plus `CANCELLED`/`NO_SHOW`/`LEFT_EARLY`/`EXPIRED` branches). See `packages/db/src/services/seat-state-machine.ts` for the full transition table — **this is the only code path allowed to change a seat's status.**
- `PaymentIntent` — one per seat-hold-with-payment, tracks Paystack reference + status.
- `Feedback`, `TrustEvent`, `TrustProfile`, `MutualInterest` — post-dinner sentiment/safety/reconnection system.
- `AuditLog`, `WebhookEvent` — append-only logs (audit trail, webhook replay-protection).
- `DinnerContext`, `ThemePerformance`, `UserThemeSignal` — theme-engine data collection (contextual snapshots per completed dinner, aggregated theme performance, per-user theme affinity), added for future recommendation/theme-tuning work.

## Auth & authorization (defense in depth, verified as of this doc)

1. **Clerk** handles identity. `apps/web/src/middleware.ts` runs `clerkMiddleware` on every route except an explicit public allowlist (`/`, `/sign-in`, `/sign-up`, `/api/webhooks`, `/api/health`, `/api/auth`, `/api/dinners`, `/api/restaurants`, `/discover`, `/dinner/*`).
2. On first authenticated request, `getOrSyncUser()` (`apps/web/src/lib/auth/core.ts`) upserts a local `User` row keyed on Clerk's `authProviderId`, defaulting to `DINER`.
3. **Layout-level guards**: `admin/layout.tsx` requires `RESTAURANT_ADMIN` or `PLATFORM_ADMIN`; `admin/ops/layout.tsx` requires `PLATFORM_ADMIN` specifically (`requireUserRole()`, redirects to `/app/unauthorized` otherwise).
4. **Action-level guards**: every server action re-checks role/ownership independently of the layout (e.g. `admin/ops/restaurants/actions.ts` checks `dbUser.role !== Role.PLATFORM_ADMIN` again inside `approveRestaurant`, `pauseRestaurant`, etc.) — so a bug in the layout guard alone can't silently escalate access.
5. Restaurant-owner actions additionally check `restaurantRepository.isUserOwner(restaurantId, user.id)` before any mutation — this is applied consistently across restaurant profile edits, media upload/delete, and theme enablement.

There is currently no role-selection-at-signup or self-service "become a host" flow beyond the restaurant-approval queue at `/admin/ops/restaurants/pending` — a user becomes `RESTAURANT_ADMIN` by creating a restaurant, which then sits `PENDING` until a platform admin approves it.

## Seat booking flow

1. `POST /api/bookings/create` → `seatRepository.holdSeatForDinner(userId, dinnerId, holdMinutes)`. This is the real, wired-up hold path (there is also a `SeatStateMachine.holdSeat()` — **removed**, it was dead code, see `docs/DECISIONS.md`).
2. Seat transitions are atomic and race-safe: every status change goes through `SeatStateMachine.transitionSeatStatus()`, which does a guarded `updateMany({ where: { id, status: expectedFromStatus } })` and checks the affected-row count before proceeding — a concurrent transition that already moved the seat off the expected status causes a clean rejection instead of a silent overwrite. (Verified empirically against the dev DB — see `docs/DECISIONS.md`, 2026-07-18 entry.)
3. Paid dinners: a `PaymentIntent` is created and the user is redirected to Paystack's hosted checkout (there is **no custom in-app payment form** — see `docs/STATUS.md` for how this differs from the original wireframes).
4. Confirmation happens via **two paths that both need to agree**: the Paystack webhook (`/api/payments/webhook`, HMAC-SHA512 signature verified, replay-protected via `WebhookEvent`) is the primary path; `/api/payments/verify` has a fallback that also calls `seatRepository.confirmSeat()` in case the webhook hasn't landed yet when the user returns from checkout.
5. Expired holds are lazily reclaimed inline (a `findFirst` for a dinner's available seats also matches `HELD` seats whose `holdExpiresAt` has passed) — the `expire-holds` cron job is a periodic sweep on top of that, not the only mechanism.

## Background jobs (Vercel Cron)

Configured in `vercel.json`, four jobs, all authenticated the same way: Vercel sends `Authorization: Bearer $CRON_SECRET` (not a query param — this was previously broken for two of the four routes; fixed 2026-07-18, see `docs/DECISIONS.md`).

| Job | Schedule | Purpose |
|---|---|---|
| `expire-holds` | every minute | Sweeps expired `HELD` seats back to `AVAILABLE` |
| `mark-no-shows` | every 10 min | Marks `CONFIRMED` seats as `NO_SHOW` if the dinner started >30min ago with no check-in; creates a negative `TrustEvent` |
| `send-reminders` | daily 09:00 | Emails confirmed diners 24h before their dinner |
| `send-feedback-requests` | daily 10:00 | Emails diners to request post-dinner feedback |

## Security posture (current, honest)

- **Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` — set in both `middleware.ts` and `next.config.js`. **No Content-Security-Policy is set yet.**
- **Rate limiting**: a real in-memory sliding-window limiter exists (`apps/web/src/lib/rate-limit.ts`) but is only wired up on `/api/payments/create`. It's per-server-instance (a plain `Map`), so it won't hold under Vercel's multi-instance serverless scaling — fine as a stopgap, not a real production control. `/api/bookings/create` and `/api/seats/hold` — the endpoints actually exposed to booking abuse — have no rate limiting.
- **Webhook security**: Paystack webhook signature verification (HMAC-SHA512) and replay protection are implemented and correct.
- **Secrets**: `.env`/`apps/web/.env` are gitignored and not committed. The `.env.example` templates previously contained real-looking R2/Clerk credentials — scrubbed 2026-07-18, but **rotate them in the actual Cloudflare/Clerk dashboards** if that hasn't happened, since they were committed to a public GitHub repo before the scrub.

## Scaling posture

This is a monolith (single Next.js app, single Postgres database) with role-based separation rather than service separation. That's the right trade-off below roughly 50K users — simpler to build, consistent data, one deploy — and it's designed to evolve rather than being a dead end:

- **0–50K users**: current architecture is fine as-is.
- **50K–200K users**: add read replicas + a caching layer before the primary database becomes the bottleneck; watch query latency and connection-pool exhaustion.
- **200K+ users**: consider extracting the three surfaces (diner / restaurant-admin / platform-ops) behind an API gateway while keeping one database, before going further.
- **1M+ users**: full service separation, likely with the payment domain split out first (it has the strictest consistency/audit requirements).

The `@dinewithme/*` package boundaries exist specifically so that extraction is a refactor, not a rewrite, if/when it's needed.

## Known architectural debt (as of 2026-07-18)

- Fixed today: a real circular import (`repositories/index.ts → seat.repository.ts → seat-state-machine.ts → audit-logger.ts → repositories/index.ts`) that "worked" by accident of module-evaluation order under webpack but crashed outright under other tooling. Worth grepping for the same pattern (anything importing the `repositories` barrel from inside `services/` or `utils/`) before it recurs.
- `tests/` mixes real automated tests (`*.test.ts`, run by vitest) with ad hoc manual debug scripts (`test-*.ts`, not run by anything) — not yet cleaned up.
- No admin-facing UI for analytics, bookings overview, or user management, despite the events/data existing server-side (PostHog tracking is applied consistently, there's just no dashboard to view it).
