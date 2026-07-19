# Tests

Real, automated tests only — everything in this directory is a `*.test.ts` file that `vitest` actually runs. If you're looking for the older manual/log-based verification scripts, they've moved to `scripts/manual-checks/` (see that directory's README for what each one does and why they were moved).

## Running

```bash
npx vitest run tests/           # run everything once
npx vitest run tests/state-machine.test.ts   # run one file
npx vitest                      # watch mode
```

These tests run against your actual local database (`DATABASE_URL` in `.env`) — they create their own fixtures and clean them up in `afterAll`, but they do talk to a real Postgres instance, not a mock.

## What's covered

- **`concurrent-bookings.test.ts`** — the seat-hold race condition. Fires N concurrent `seatRepository.holdSeatForDinner()` calls at a single seat and asserts exactly one wins; also asserts a user can't hold two seats for the same dinner. This is the real production booking path (`/api/bookings/create` and `/api/seats/hold` both call this method) — not a reimplementation of it.
- **`state-machine.test.ts`** — the seat state-machine transition table: valid transitions succeed with the right side effects (hold fields cleared on confirm, etc.), invalid transitions (including from terminal states) are rejected, and `isValidTransition()`/`getValidTransitions()` agree with what's actually enforced.
- **`refund-race.test.ts`** — the same class of race as the seat-hold one, in `paymentIntentRepository.refundPayment()`. Fires 2 concurrent refund calls at the same payment intent and asserts exactly one succeeds. Calls the real repository method the `/api/payments/refund` route uses (fixed 2026-07-18 — see `docs/DECISIONS.md`).

## What's not covered yet

Payment webhook handling, payment intent creation, feedback eligibility, theme enablement/analytics, check-in/no-show/hold-expiry jobs, dinner/restaurant creation, and the my-dinners listing only have manual scripts in `scripts/manual-checks/` right now — see `docs/STATUS.md` for the current honest list. If you're adding a test for one of these, follow the pattern in the files above: create fixtures in `beforeAll`, call the real repository/API function (not a reimplementation of its logic), assert with `expect()`, clean up in `afterAll`.
