# EPIC 1.4: Quick Test Reference

## 🚀 Quick Start

```powershell
# Start dev server
npm run dev

# Open browser to http://localhost:3001
```

---

## 👥 Test Users

### DINER User
- **Email:** `diner@test.com`
- **Role:** DINER (default)
- **Can Access:** `/`, `/dashboard`, `/app/*`
- **Cannot Access:** `/admin/*`

### ADMIN User
- **Email:** `lu.petros@outlook.com`
- **Role:** PLATFORM_ADMIN (after promotion)
- **Can Access:** All routes

---

## 🧪 Quick Tests

### Test 1: Public Access (No Sign In)
```
✅ http://localhost:3001/
✅ http://localhost:3001/sign-in
✅ http://localhost:3001/sign-up
```

### Test 2: DINER Access (Sign in as diner@test.com)
```
✅ http://localhost:3001/dashboard
✅ http://localhost:3001/app
❌ http://localhost:3001/admin → Redirects to /app/unauthorized
```

### Test 3: ADMIN Access (Sign in as lu.petros@outlook.com)
```
✅ http://localhost:3001/dashboard
✅ http://localhost:3001/app
✅ http://localhost:3001/admin
```

---

## 🔧 Setup Commands

### Create DINER User
1. Sign up at http://localhost:3001/sign-up with `diner@test.com`
2. Visit http://localhost:3001/dashboard (syncs to database)

### Create ADMIN User
1. Sign up at http://localhost:3001/sign-up with `lu.petros@outlook.com`
2. Visit http://localhost:3001/dashboard (syncs to database)
3. Run: `.\promote-admin.ps1`

### Verify Users
```powershell
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role FROM users;"
```

---

## 📍 Test URLs

| URL | Public | DINER | ADMIN |
|-----|--------|-------|-------|
| `/` | ✅ | ✅ | ✅ |
| `/sign-in` | ✅ | ✅ | ✅ |
| `/dashboard` | ❌ | ✅ | ✅ |
| `/app` | ❌ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ✅ |

---

## ✅ Expected Behaviors

### DINER tries to access `/admin`:
1. Middleware checks authentication ✅
2. Middleware checks role in database
3. Role is DINER (not admin)
4. Redirects to `/app/unauthorized?reason=admin_access_required&role=DINER`
5. Shows friendly error page with:
   - Lock emoji 🔒
   - "Admin Access Required" message
   - Current role: DINER
   - "Go to Dashboard" button
   - "Back to Home" link

### ADMIN accesses `/admin`:
1. Middleware checks authentication ✅
2. Middleware checks role in database
3. Role is PLATFORM_ADMIN ✅
4. Allows access
5. Shows admin portal with:
   - Welcome message
   - Role badge: PLATFORM_ADMIN
   - Placeholder feature cards

---

## 🐛 Troubleshooting

### Issue: "User not found in database"
**Fix:** Visit `/dashboard` to trigger user sync

### Issue: Role change not working
**Fix:** 
```powershell
# Verify in database
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role FROM users WHERE email = 'your-email';"

# Hard refresh browser (Ctrl+Shift+R)
```

### Issue: Infinite redirect
**Fix:** Check that `/app/unauthorized` is not in protected routes matcher

---

## 📊 Quick Verification

```powershell
# Check all users and roles
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "SELECT email, role, \"authProviderId\" FROM users;"

# Promote user to admin
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'PLATFORM_ADMIN' WHERE email = 'your-email@example.com';"

# Demote user to diner
$env:PGPASSWORD='postgres'
psql -U postgres -d dinewithme -c "UPDATE users SET role = 'DINER' WHERE email = 'your-email@example.com';"
```

---

## ✨ Success Criteria

- [ ] Public routes work without sign in
- [ ] Protected routes redirect to sign in
- [ ] DINER can access `/app` but not `/admin`
- [ ] ADMIN can access all routes
- [ ] Unauthorized page shows correct error
- [ ] Role changes take effect immediately
- [ ] No TypeScript errors
- [ ] No console errors

---

## 📝 Notes

- Middleware runs on every request
- Role is checked in database (no caching)
- Changes take effect immediately (no sign-out needed)
- Unauthorized page is user-friendly with Apple-native styling
