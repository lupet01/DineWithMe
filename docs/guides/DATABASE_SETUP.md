# Database Setup for DineWithMe

## Prerequisites
- PostgreSQL installed and running

## Setup Steps

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dinewithme;

# Create user (if needed)
CREATE USER dinewithme_user WITH PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dinewithme TO dinewithme_user;

# Exit
\q
```

### 2. Update Environment Variables

Update `apps/web/.env`:

```env
DATABASE_URL=postgresql://dinewithme_user:your_password@localhost:5432/dinewithme?schema=public
```

Or use default postgres user:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dinewithme?schema=public
```

### 3. Push Schema to Database

```bash
# From project root
cd apps/web
npx prisma db push --schema=../../prisma/schema.prisma
```

Or:

```bash
# From packages/db (with DATABASE_URL in root .env)
npm run db:push
```

### 4. Verify Database

```bash
# Connect to database
psql -U postgres -d dinewithme

# List tables
\dt

# Check users table
\d users

# Exit
\q
```

Expected output:
```
                Table "public.users"
     Column      |           Type           | Nullable
-----------------+--------------------------+----------
 id              | text                     | not null
 authProviderId  | text                     | not null
 email           | text                     | not null
 firstName       | text                     |
 lastName        | text                     |
 avatarUrl       | text                     |
 status          | text                     | not null
 createdAt       | timestamp(3)             | not null
 updatedAt       | timestamp(3)             | not null
```

### 5. Generate Prisma Client

```bash
cd packages/db
npm run db:generate
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `pg_ctl status`
- Check port: PostgreSQL default is 5432

### Authentication Failed
- Verify username and password in DATABASE_URL
- Check pg_hba.conf for authentication method

### Database Does Not Exist
- Create it manually: `createdb dinewithme`
- Or use psql: `CREATE DATABASE dinewithme;`

### Permission Denied
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE dinewithme TO your_user;`
- For schema: `GRANT ALL ON SCHEMA public TO your_user;`

## Alternative: Use Docker

```bash
# Run PostgreSQL in Docker
docker run --name dinewithme-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dinewithme \
  -p 5432:5432 \
  -d postgres:15

# DATABASE_URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dinewithme?schema=public
```

## Next Steps

After database is set up:
1. Restart dev server: `npm run dev`
2. Sign in to the app
3. Visit `/dashboard` to trigger user sync
4. Check database: `SELECT * FROM users;`
