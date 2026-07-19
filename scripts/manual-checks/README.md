# Manual Checks

These are **manual, log-based verification scripts**, not automated tests. Nothing in this directory runs in CI or is checked by vitest. They print `✅`/`❌` to the console for a human to read, and most require the database to already have seeded data (a scheduled dinner, at least one restaurant, etc.) or the dev server to be running on `localhost:3001`.

They were moved out of `tests/` because that directory should only contain files vitest actually executes — having 18 files named `test-*.ts` sitting alongside 2 real `*.test.ts` files gave a false impression of automated coverage. See `docs/STATUS.md` for the current honest state of test coverage.

Run any of them with:
```bash
npx tsx scripts/manual-checks/test-name.ts
```

## What's here

| Script | What it checks | Requires |
|---|---|---|
| `test-restaurant-setup.ts` | Restaurant creation flow | — |
| `test-dinner-creation.ts` | Dinner creation flow | A restaurant + theme to exist |
| `test-seat-confirm.ts` | Seat confirmation flow | A held seat |
| `test-seat-cancel.ts` | Seat cancellation flow | A confirmed seat |
| `test-seat-check-in.ts` | Check-in flow | A confirmed seat, dinner near start time |
| `test-seat-payment-requirement.ts` | Payment-required-before-confirm enforcement | A held seat |
| `test-payment-intent.ts` | Payment intent creation | A held seat |
| `test-payment-create.ts` | Payment creation flow | `PAYSTACK_SECRET_KEY` set |
| `test-payment-webhook.ts` | Webhook signature + event handling | Dev server running, `PAYSTACK_SECRET_KEY` set — mostly prints manual testing instructions (Paystack CLI / ngrok / curl) rather than asserting anything itself |
| `test-payment-refund.ts` | Refund processing | A confirmed, paid seat |
| `test-feedback-eligibility.ts` | Post-dinner feedback eligibility rules | A completed dinner with attended seats |
| `test-mark-no-shows.ts` | No-show marking job | A confirmed seat on a dinner that's already started |
| `test-expire-holds.ts` | Hold-expiry job | A held seat with an expired `holdExpiresAt` |
| `test-theme-enablement.ts` | Per-restaurant theme enable/disable | A restaurant + theme |
| `test-theme-analytics.ts` | Theme performance aggregation | Some completed dinners with feedback |
| `test-my-dinners.ts` | User's dinner listing (upcoming/past) | A user with bookings |

## If you want real coverage instead

Two things already have proper automated tests you can use as a template — `tests/concurrent-bookings.test.ts` (seat-hold concurrency, calls the real `seatRepository.holdSeatForDinner`) and `tests/state-machine.test.ts` (seat state machine transition table, calls the real `SeatStateMachine.transitionSeatStatus`). Both create their own fixtures in `beforeAll`, assert with `expect()`, and clean up in `afterAll` — that's the pattern to follow for converting any of the scripts above.

**A cautionary example**: the script that used to be `tests/test-seat-hold-concurrency.ts` looked like it tested seat-hold concurrency, but it reimplemented its own separate (and separately unguarded) hold logic inline instead of calling the real `seatRepository.holdSeatForDinner()` — it wasn't testing production code at all, and wouldn't have caught the real race condition that existed in that code (fixed 2026-07-18, see `docs/DECISIONS.md`). It's been deleted in favor of the real test. When converting one of the scripts above, make sure the test calls the actual repository/API function rather than re-deriving the logic.
