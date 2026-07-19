# Documentation Index

This directory contains all project documentation organized by category. Only `README.md` lives at the repo root — everything else is here.

## 🎯 Start here

Three living documents replace the need to read everything else:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the system is actually built right now (data model, auth, seat lifecycle, payments, security posture, scaling notes)
- **[STATUS.md](./STATUS.md)** — what's actually true right now: what's solid, what was just fixed, what's still broken or missing
- **[DECISIONS.md](./DECISIONS.md)** — a terse, dated log of significant decisions and why they were made, distilled from the full `epics/`/`archive/` history

Read these three before anything else in this directory. They're meant to be kept current — everything else below is either a still-relevant how-to guide, or historical record.

## 📁 Directory Structure

```
docs/
├── epics/          # Epic completion documentation (EPIC_*.md) — historical build log
├── guides/         # Setup and how-to guides (still-relevant, actionable)
├── fixes/          # Point-in-time bug fix write-ups
├── references/     # Evergreen reference docs — auth, jobs, state machine, architecture, checklists
├── deployment/      # Deployment planning docs (production readiness, gaps, phase plans)
└── archive/         # Superseded/point-in-time status reports — historical record only, not current truth
```

**A note on trustworthiness**: several docs in `epics/`, `fixes/`, and especially `archive/` are self-reported completion logs from earlier build sessions (some grade their own work, e.g. "A+ 98/100"). They reflect what an agent *believed* was true at the time, not necessarily the current state of the code. Prefer reading the actual source or running `tsc`/tests over trusting a status doc — treat these as historical narrative, not a live source of truth.

---

## 📚 Quick Links

### Getting Started
- [Database Setup](./guides/DATABASE_SETUP.md)
- [Admin Setup Guide](./guides/ADMIN_SETUP_GUIDE.md)
- [Admin Access Guide](./guides/ADMIN_ACCESS_GUIDE.md) (and an alternate script-based walkthrough: [ADMIN_ACCESS_GUIDE_SEED_SCRIPTS.md](./guides/ADMIN_ACCESS_GUIDE_SEED_SCRIPTS.md) — these two overlap and should eventually be merged)
- [Accessing New UI](./guides/ACCESSING_NEW_UI.md)
- [Quick Start](./guides/QUICK_START.md)

### Architecture & Design
- [Architecture Breakdown](./references/ARCHITECTURE_BREAKDOWN.md)
- [Platform Breakdown](./references/PLATFORM_BREAKDOWN.md)
- [Wireframes](./references/WIREFRAMES.md)
- [Current Auth Framework](./references/CURRENT_AUTH_FRAMEWORK.md)

### Core Systems
- [Authentication System](./references/auth.md)
- [Seat Lifecycle Reference](./references/SEAT_LIFECYCLE_REFERENCE.md)
- [State Machine Documentation](./references/state-machine.md)
- [Background Jobs](./references/jobs.md)

### Deployment & Production Readiness
- [Production Deployment Plan (Revised)](./deployment/PRODUCTION_DEPLOYMENT_PLAN_REVISED.md)
- [Critical Deployment Gaps Summary](./deployment/CRITICAL_DEPLOYMENT_GAPS_SUMMARY.md) — note: several items here have since been fixed; verify against source before acting
- [Deployment Quick Reference](./deployment/DEPLOYMENT_QUICK_REFERENCE.md)

### Integration Guides
- [Cloudflare R2 Setup](./guides/CLOUDFLARE_R2_SETUP.md)
- [GitHub Actions Setup](./guides/GITHUB_ACTIONS_SETUP.md)
- [Free Cron Setup](./guides/FREE_CRON_SETUP.md)
- [Windows Task Scheduler Setup](./guides/WINDOWS_TASK_SCHEDULER_SETUP.md)

### Development
- [Theme Implementation Status](./references/THEME_IMPLEMENTATION_STATUS.md)
- [Performance Checklist](./references/PERFORMANCE_CHECKLIST.md)
- [Test Checklist](./references/TEST_CHECKLIST.md)
- [Troubleshooting](./references/TROUBLESHOOTING.md)

### Project Status
- [Current Status](./references/CURRENT_STATUS.md)
- [Progress Summary](./references/PROGRESS_SUMMARY.md)
- [Project Progress Report](./references/PROJECT_PROGRESS_REPORT.md)
- [TODO List](./references/TODO.md)

---

## 📖 Epic Documentation

All epic completion documentation is in the [epics/](./epics/) directory, organized by epic number:

### Epic 1: Foundation
- [1.2 - Database & Environment](./epics/EPIC_1.2_SUMMARY.md)
- [1.3 - User Management](./epics/EPIC_1.3_COMPLETE.md)
- [1.4 - Admin Dashboard](./epics/EPIC_1.4_COMPLETE.md)
- [1.5 - API Routes](./epics/EPIC_1.5_COMPLETE.md)
- [1.6 - Role System](./epics/EPIC_1.6_COMPLETE.md)
- [1.7 - Authentication](./epics/EPIC_1.7_COMPLETE.md)

### Epic 2: Restaurant Management
- [2.1 - Restaurant Setup](./epics/EPIC_2.1_COMPLETE.md)
- [2.2 - Admin Interface](./epics/EPIC_2.2_COMPLETE.md)
- [2.3 - Restaurant Forms](./epics/EPIC_2.3_COMPLETE.md)
- [2.4 - Media Management](./epics/EPIC_2.4_COMPLETE.md)
- [2.6 - Restaurant Features](./epics/EPIC_2.6_COMPLETE.md)
- [2.7 - Advanced Features](./epics/EPIC_2.7_COMPLETE.md)
- [2.8 - Testing](./epics/EPIC_2.8_COMPLETE.md)

### Epic 3: Seat Management
- [3.1 - Seat System](./epics/EPIC_3.1_COMPLETE.md)
- [3.2 - Seat Holding](./epics/EPIC_3.2_COMPLETE.md)
- [3.3 - Background Jobs](./epics/EPIC_3.3_COMPLETE.md)
- [3.4 - Seat Confirmation](./epics/EPIC_3.4_COMPLETE.md)
- [3.5 - Seat Cancellation](./epics/EPIC_3.5_COMPLETE.md)
- [3.6 - Check-in System](./epics/EPIC_3.6_COMPLETE.md)
- [3.7 - No-Show Handling](./epics/EPIC_3.7_COMPLETE.md)
- [3.8 - State Machine](./epics/EPIC_3.8_COMPLETE.md)
- [3.9 - Testing](./epics/EPIC_3.9_COMPLETE.md)

### Epic 4: Diner Frontend
- [4.1 - UI Foundation](./epics/EPIC_4.1_COMPLETE.md)
- [4.2 - Discover Page](./epics/EPIC_4.2_COMPLETE.md)
- [4.3 - Dinner Details](./epics/EPIC_4.3_COMPLETE.md)
- [4.5 - Confirmation Flow](./epics/EPIC_4.5_COMPLETE.md)
- [4.6 - My Dinners](./epics/EPIC_4.6_COMPLETE.md)
- [4.7 - Booking Management](./epics/EPIC_4.7_COMPLETE.md)
- [4.8 - Polish](./epics/EPIC_4.8_COMPLETE.md)

### Epic 5: Feedback System
- [5.1 - Feedback Models](./epics/EPIC_5.1_COMPLETE.md)
- [5.2 - Feedback Eligibility](./epics/EPIC_5.2_COMPLETE.md)
- [5.3 - Feedback Flow](./epics/EPIC_5.3_COMPLETE.md)
- [5.4 - Trust Profiles](./epics/EPIC_5.4_COMPLETE.md)
- [5.5 - Connections](./epics/EPIC_5.5_COMPLETE.md)
- [5.6 - Complete](./epics/EPIC_5.6_COMPLETE.md)

### Epic 6: Theme Engine
- [6.1 - Theme Models](./epics/EPIC_6.1_COMPLETE.md)
- [6.2 - Theme Management](./epics/EPIC_6.2_COMPLETE.md)
- [6.3 - Dinner Creation](./epics/EPIC_6.3_COMPLETE.md)
- [6.4 - Theme Integration](./epics/EPIC_6.4_COMPLETE.md)
- [6.5 - Analytics](./epics/EPIC_6.5_COMPLETE.md)
- [6 - Complete Summary](./epics/EPIC_6_COMPLETE_SUMMARY.md)

### Epic 7: Payment Integration
- [7.1 - Payment Intents](./epics/EPIC_7.1_COMPLETE.md)
- [7.2 - Payment Creation](./epics/EPIC_7.2_COMPLETE.md)
- [7.3 - Webhooks](./epics/EPIC_7.3_COMPLETE.md)
- [7.4 - Refunds](./epics/EPIC_7.4_COMPLETE.md)
- [7 - Implementation Complete](./epics/EPIC_7_IMPLEMENTATION_COMPLETE.md)

### Epic 8: Restaurant Onboarding
- [8 - Impact Analysis](./epics/EPIC_8_IMPACT_ANALYSIS.md)
- [8 - Restaurant Onboarding](./epics/EPIC_8_RESTAURANT_ONBOARDING.md)

---

## 🔧 Fixes & Troubleshooting

Common issues and their solutions are documented in [fixes/](./fixes/):

- [Clerk Auth Fix](./fixes/fix-clerk-auth.md)
- [Button Not Working Fix](./fixes/BUTTON_NOT_WORKING_FIX.md)
- [R2 CORS Fix](./fixes/R2_CORS_FIX.md)
- [Admin Routes Fix](./fixes/ADMIN_ROUTES_FIX.md)
- [UI Navigation Fix](./fixes/UI_NAVIGATION_FIX.md)
- [Lucide Icons Fix](./fixes/LUCIDE_FIX.md)

---

## 🗄️ Archive

[archive/](./archive/) holds superseded, point-in-time status/completion reports (e.g. `SECTION_*_REPORT.md`, `*_COMPLETE.md`, `*_FIXES_APPLIED.md`) that were previously scattered across the repo root. They're kept for historical record but are **not** maintained — don't use them as a source of current status. [archive/misc/](./archive/misc/) holds a few unrelated docs (hackathon application notes) that ended up in the repo root by accident.

---

## 📝 Contributing

When adding new documentation:

1. **Made a structural/architectural change?** → Update `ARCHITECTURE.md` in the same PR, not later.
2. **Made a significant decision or fix worth remembering?** → Add one dated line to `DECISIONS.md`. Don't write a new standalone doc for it.
3. **Fixed something or built a new feature?** → Update `STATUS.md`'s relevant section (move it out of "known gaps" if it's now fixed, or add it there if you found a new one).
4. **Guides** → Place in `docs/guides/` for setup and how-to documentation that's still actionable.
5. **Deployment** → Place in `docs/deployment/` for production-readiness/deployment planning docs.
6. **Archive** → Once a doc is superseded or purely historical, move it to `docs/archive/` rather than leaving it live at the root or in an active folder.
7. **Never** add new docs to the repo root — `README.md` is the only file that belongs there.
8. Avoid creating a new `EPIC_X.Y_COMPLETE.md`-style doc per feature going forward — fold the "what and why" into `DECISIONS.md` instead. That pattern is exactly what made this directory need a cleanup.

Update this README when adding significant new documentation.
