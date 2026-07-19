-- CreateEnum
CREATE TYPE "RestaurantMediaType" AS ENUM ('HERO', 'GALLERY');

-- CreateTable
CREATE TABLE "restaurant_media" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "type" "RestaurantMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurant_media_restaurantId_idx" ON "restaurant_media"("restaurantId");

-- CreateIndex
CREATE INDEX "restaurant_media_restaurantId_type_idx" ON "restaurant_media"("restaurantId", "type");

-- AddForeignKey
ALTER TABLE "restaurant_media" ADD CONSTRAINT "restaurant_media_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
