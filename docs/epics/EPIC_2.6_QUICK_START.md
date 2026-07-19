# EPIC 2.6: Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Regenerate Prisma Client

**Stop dev server first** (Ctrl+C), then:

```bash
cd prisma
npx prisma generate
```

### Step 2: Seed Test Data

```bash
npx tsx seed-dinners.ts
```

Creates 5 sample dinners:
- 3 upcoming (SCHEDULED)
- 1 completed
- 1 cancelled

### Step 3: Start & Test

```bash
npm run dev
```

Navigate to: **http://localhost:3001/admin/dinners**

---

## 🎯 What You Can Do

### View Dinners
- See all dinners in a table
- Filter by: All / Upcoming / Past
- View: Date, Time, Theme, Seats, Status

### Manage Status
- **Mark Live**: SCHEDULED → LIVE
- **Complete**: LIVE → COMPLETED
- **Cancel**: SCHEDULED/LIVE → CANCELLED

### Track Changes
- All actions tracked with analytics
- Seat release on cancellation
- Status change history

---

## 🎨 Status Colors

- 🔵 **SCHEDULED** - Blue badge
- 🟢 **LIVE** - Green badge
- ⚫ **COMPLETED** - Gray badge
- 🔴 **CANCELLED** - Red badge

---

## 📊 Sample Data

After seeding, you'll see:

| Theme | Date | Seats | Status |
|-------|------|-------|--------|
| Italian Night | +2 days | 8/12 | SCHEDULED |
| Sushi Experience | +5 days | 6/8 | SCHEDULED |
| Farm to Table | +7 days | 10/16 | SCHEDULED |
| French Bistro | -2 days | 10/10 | COMPLETED |
| BBQ Night | -5 days | 0/20 | CANCELLED |

---

## ✅ Quick Test

1. Click "Upcoming" tab → See 3 dinners
2. Find "Italian Night"
3. Click "Mark Live" → Status turns green
4. Click "Complete" → Status turns gray
5. Find "Sushi Experience"
6. Click "Cancel" → Seats reset to 0

---

## 🐛 Troubleshooting

**Error: "Dinner not found"**
→ Run `npx prisma generate`

**No dinners showing**
→ Run `npx tsx seed-dinners.ts`

**Can't access page**
→ Sign in as RESTAURANT_ADMIN

**Actions don't work**
→ Check browser console for errors

---

## 📚 Full Documentation

- `EPIC_2.6_COMPLETE.md` - Complete implementation details
- `EPIC_2.6_TEST_GUIDE.md` - Detailed testing steps
- `EPIC_2.6_SUMMARY.md` - Architecture and features

---

## 🎉 Success!

If you can:
- ✅ See the dinners table
- ✅ Filter by tabs
- ✅ Update status
- ✅ Cancel dinners

Then EPIC 2.6 is working perfectly!
