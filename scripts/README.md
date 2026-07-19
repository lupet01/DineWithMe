# Scripts

This directory contains utility scripts for database management, seeding, and administration.

## 📁 Directory Structure

```
scripts/
├── admin/            # User role and admin management scripts
├── database/         # Database maintenance and migration scripts
├── seed/             # Data seeding and migration scripts
└── manual-checks/    # Manual verification scripts (NOT automated tests — see below)
```

## 🔍 Manual Checks (`manual-checks/`)

These were previously in `tests/` alongside real automated tests, which was misleading — `tests/` should only contain files vitest actually runs (`*.test.ts`). These are manual, log-based scripts: they print `✅`/`❌` to the console for a human to read, generally require pre-existing seeded data or a running dev server, and are not run by CI or any automated process. See `scripts/manual-checks/README.md` for what each one does and how to run it.

If you want real coverage for one of these areas, write (or extend) a proper `*.test.ts` file in `tests/` instead — see `tests/concurrent-bookings.test.ts` and `tests/state-machine.test.ts` for the pattern (create fixtures, call the real repository/API code, assert with `expect()`, clean up in `afterAll`).

---

## 🔐 Admin Scripts (`admin/`)

Scripts for managing user roles and admin access.

### Setup Admin User
```powershell
.\scripts\admin\setup-admin-user.ps1
```
Creates a new admin user or promotes an existing user to admin.

### Update User Role
```powershell
.\scripts\admin\update-role.ps1
.\scripts\admin\update-user-role.ps1
.\scripts\admin\promote-admin.ps1
```
Various scripts for updating user roles in the database.

**TypeScript Alternative:**
```bash
npx tsx scripts/set-user-role.ts <email> <role>
```
Valid roles: `DINER`, `RESTAURANT_ADMIN`, `PLATFORM_ADMIN`

Example:
```bash
npx tsx scripts/set-user-role.ts user@example.com RESTAURANT_ADMIN
```

**Usage:**
1. Ensure database is running
2. Have user email ready
3. Run script and follow prompts

---

## 🗄️ Database Scripts (`database/`)

Scripts for database maintenance and troubleshooting.

### Test Database Connection
```powershell
.\scripts\database\test-database.ps1
```
Verifies database connection and displays connection info.

### Fix Prisma Generate
```powershell
.\scripts\database\fix-prisma-generate.ps1
```
Fixes Prisma client generation issues.

### Regenerate Prisma
```powershell
.\scripts\database\regenerate-prisma.ps1
```
Regenerates Prisma client from scratch.

### Run Restaurant Migration
```powershell
.\scripts\database\run-restaurant-migration.ps1
```
Runs restaurant-specific database migrations.

### Expire Holds Now
```powershell
.\scripts\database\expire-holds-now.ps1
```
Manually triggers the expire holds job (useful for testing).

### Clear Cache and Restart
```powershell
.\scripts\database\clear-cache-and-restart.ps1
```
Clears Next.js cache and restarts development server.

---

## 🌱 Seed Scripts (`seed/`)

Scripts for populating the database with test or initial data.

### Seed Themes
```bash
npx tsx scripts/seed/seed-themes.ts
```
Seeds the database with predefined table themes.

### Seed Strategic Themes
```bash
npx tsx scripts/seed/seed-strategic-themes.ts
```
Seeds strategic/curated themes for the platform.

### Seed Dinners
```bash
npx tsx scripts/seed/seed-dinners.ts
```
Creates sample dinner events for testing.

### Migrate Theme Data
```bash
npx tsx scripts/seed/migrate-theme-data.ts
```
Migrates existing theme data to new schema.

### Create Test User
```bash
npx tsx scripts/seed/create-test-user.ts
```
Creates a test user account.

### Setup After Reset
```bash
npx tsx scripts/seed/setup-after-reset.ts
```
Runs all necessary setup after database reset.

### Setup Restaurant Only
```bash
npx tsx scripts/seed/setup-restaurant-only.ts
```
Sets up a restaurant without full database reset.

---

## 🚀 Common Workflows

### Fresh Database Setup
```bash
# 1. Reset database
npx prisma migrate reset

# 2. Run setup script
npx tsx scripts/seed/setup-after-reset.ts

# 3. Create admin user
.\scripts\admin\setup-admin-user.ps1

# 4. Seed themes
npx tsx scripts/seed/seed-themes.ts

# 5. Seed sample dinners
npx tsx scripts/seed/seed-dinners.ts
```

### Add New Restaurant
```bash
# 1. Create restaurant admin user (via UI or script)
npx tsx scripts/seed/create-test-user.ts

# 2. Promote to restaurant admin
.\scripts\admin\update-role.ps1

# 3. Setup restaurant
npx tsx scripts/seed/setup-restaurant-only.ts
```

### Troubleshooting Database Issues
```powershell
# 1. Test connection
.\scripts\database\test-database.ps1

# 2. Regenerate Prisma client
.\scripts\database\regenerate-prisma.ps1

# 3. Clear cache
.\scripts\database\clear-cache-and-restart.ps1
```

---

## 📝 Script Conventions

### PowerShell Scripts (.ps1)
- Use for Windows-specific operations
- Include error handling
- Provide user feedback
- Require execution policy: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

### TypeScript Scripts (.ts)
- Use for database operations
- Run with `npx tsx`
- Include proper error handling
- Disconnect Prisma client on completion

### Naming Convention
- `setup-*.ps1` / `setup-*.ts` - Initial setup scripts
- `seed-*.ts` - Data seeding scripts
- `test-*.ps1` - Testing/verification scripts
- `migrate-*.ts` - Data migration scripts
- `*-admin*.ps1` - Admin management scripts

---

## ⚠️ Important Notes

### Before Running Scripts

1. **Backup your database** if running in production
2. **Check environment variables** are set correctly
3. **Read script comments** for prerequisites
4. **Test in development** before production use

### Database Scripts
- Most scripts require `DATABASE_URL` environment variable
- Some scripts modify data permanently
- Always review script contents before running

### Admin Scripts
- Require database access
- May need elevated permissions
- Changes are immediate and permanent

### Seed Scripts
- May create duplicate data if run multiple times
- Some scripts are idempotent, others are not
- Check script documentation for behavior

---

## 🔧 Adding New Scripts

When creating new scripts:

1. **Choose the right directory:**
   - `admin/` - User/role management
   - `database/` - Database operations
   - `seed/` - Data creation/migration

2. **Follow naming conventions:**
   - Descriptive, kebab-case names
   - Appropriate file extension (.ps1 or .ts)

3. **Include documentation:**
   - Header comment explaining purpose
   - Prerequisites and dependencies
   - Expected outcome
   - Example usage

4. **Add to this README:**
   - Brief description
   - Usage example
   - Any warnings or notes

5. **Test thoroughly:**
   - Test in development environment
   - Verify error handling
   - Check for side effects

---

## 📚 Related Documentation

- [Database Setup Guide](../docs/guides/DATABASE_SETUP.md)
- [Admin Setup Guide](../docs/guides/ADMIN_SETUP_GUIDE.md)
- [Test Checklist](../docs/references/TEST_CHECKLIST.md)
- [Troubleshooting](../docs/references/TROUBLESHOOTING.md)
