import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `DO $$ BEGIN CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'CLOUDY', 'RAINY', 'STORMY', 'COLD', 'HOT', 'WINDY'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "DayPeriod" AS ENUM ('LUNCH', 'DINNER', 'LATE_NIGHT'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "RestaurantType" AS ENUM ('FINE_DINING', 'CASUAL', 'BISTRO', 'ROOFTOP', 'OUTDOOR', 'PRIVATE_DINING', 'CAFE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "PriceTier" AS ENUM ('BUDGET', 'MID', 'PREMIUM'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `CREATE TABLE IF NOT EXISTS "dinner_contexts" (
    "id"                  TEXT NOT NULL PRIMARY KEY,
    "dinnerId"            TEXT NOT NULL UNIQUE,
    "themeId"             TEXT NOT NULL,
    "restaurantId"        TEXT NOT NULL,
    "city"                TEXT NOT NULL,
    "neighbourhood"       TEXT,
    "restaurantType"      "RestaurantType",
    "cuisineType"         TEXT,
    "priceTier"           "PriceTier",
    "dayOfWeek"           INTEGER NOT NULL,
    "dayPeriod"           "DayPeriod" NOT NULL,
    "month"               INTEGER NOT NULL,
    "season"              TEXT,
    "weatherCondition"    "WeatherCondition",
    "temperatureCelsius"  DOUBLE PRECISION,
    "seatsBooked"         INTEGER NOT NULL DEFAULT 0,
    "seatsTotal"          INTEGER NOT NULL,
    "fillRate"            DOUBLE PRECISION,
    "attendanceRate"      DOUBLE PRECISION,
    "avgFeedbackScore"    DOUBLE PRECISION,
    "connectionRate"      DOUBLE PRECISION,
    "wouldReturnRate"     DOUBLE PRECISION,
    "mutualInterestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("dinnerId") REFERENCES "dinners"("id") ON DELETE CASCADE,
    FOREIGN KEY ("themeId") REFERENCES "themes"("id"),
    FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_themeId_idx" ON "dinner_contexts"("themeId")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_restaurantId_idx" ON "dinner_contexts"("restaurantId")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_city_idx" ON "dinner_contexts"("city")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_dayOfWeek_idx" ON "dinner_contexts"("dayOfWeek")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_month_idx" ON "dinner_contexts"("month")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_fillRate_idx" ON "dinner_contexts"("fillRate")`,
  `CREATE INDEX IF NOT EXISTS "dinner_contexts_avgFeedbackScore_idx" ON "dinner_contexts"("avgFeedbackScore")`,
  `CREATE TABLE IF NOT EXISTS "theme_performance" (
    "id"                 TEXT NOT NULL PRIMARY KEY,
    "themeId"            TEXT NOT NULL UNIQUE,
    "totalDinners"       INTEGER NOT NULL DEFAULT 0,
    "totalSeatsBooked"   INTEGER NOT NULL DEFAULT 0,
    "avgFillRate"        DOUBLE PRECISION,
    "avgAttendanceRate"  DOUBLE PRECISION,
    "avgFeedbackScore"   DOUBLE PRECISION,
    "avgConnectionRate"  DOUBLE PRECISION,
    "avgWouldReturnRate" DOUBLE PRECISION,
    "byRestaurantType"   JSONB,
    "byCuisine"          JSONB,
    "byDayOfWeek"        JSONB,
    "byPriceTier"        JSONB,
    "byWeather"          JSONB,
    "byCity"             JSONB,
    "lastUpdatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "theme_performance_themeId_idx" ON "theme_performance"("themeId")`,
  `CREATE INDEX IF NOT EXISTS "theme_performance_avgFeedbackScore_idx" ON "theme_performance"("avgFeedbackScore")`,
  `CREATE INDEX IF NOT EXISTS "theme_performance_avgFillRate_idx" ON "theme_performance"("avgFillRate")`,
  `CREATE TABLE IF NOT EXISTS "user_theme_signals" (
    "id"               TEXT NOT NULL PRIMARY KEY,
    "userId"           TEXT NOT NULL,
    "themeId"          TEXT NOT NULL,
    "viewCount"        INTEGER NOT NULL DEFAULT 0,
    "bookingCount"     INTEGER NOT NULL DEFAULT 0,
    "attendanceCount"  INTEGER NOT NULL DEFAULT 0,
    "avgRatingGiven"   DOUBLE PRECISION,
    "lastInteractedAt" TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "themeId"),
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("themeId") REFERENCES "themes"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "user_theme_signals_userId_idx" ON "user_theme_signals"("userId")`,
  `CREATE INDEX IF NOT EXISTS "user_theme_signals_themeId_idx" ON "user_theme_signals"("themeId")`,
  `CREATE INDEX IF NOT EXISTS "user_theme_signals_bookingCount_idx" ON "user_theme_signals"("bookingCount")`,
];

for (const sql of statements) {
  await prisma.$executeRawUnsafe(sql);
}

console.log("All theme engine tables and indexes created successfully");
await prisma.$disconnect();
