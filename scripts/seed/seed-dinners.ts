import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dinners...");

  // Get the first restaurant
  const restaurant = await prisma.restaurant.findFirst();

  if (!restaurant) {
    console.error("No restaurant found. Please create a restaurant first.");
    return;
  }

  console.log(`Found restaurant: ${restaurant.name}`);

  // Create sample dinners
  const dinners = [
    {
      restaurantId: restaurant.id,
      startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      theme: "Italian Night",
      description: "Authentic Italian cuisine with wine pairing",
      seatCount: 12,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId: restaurant.id,
      startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000), // 2.5 hours later
      theme: "Sushi Experience",
      description: "Fresh sushi and sashimi prepared by master chef",
      seatCount: 8,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId: restaurant.id,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      theme: "Farm to Table",
      description: "Locally sourced ingredients, seasonal menu",
      seatCount: 16,
      status: "SCHEDULED" as const,
    },
    {
      restaurantId: restaurant.id,
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      theme: "French Bistro",
      description: "Classic French dishes with modern twist",
      seatCount: 10,
      status: "COMPLETED" as const,
    },
    {
      restaurantId: restaurant.id,
      startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours later
      theme: "BBQ Night",
      description: "Smoked meats and southern sides",
      seatCount: 20,
      status: "CANCELLED" as const,
    },
  ];

  for (const dinner of dinners) {
    const created = await prisma.dinner.create({
      data: dinner,
    });

    // Create seats for the dinner
    const seats = Array.from({ length: dinner.seatCount }, () => ({
      dinnerId: created.id,
      status: "AVAILABLE" as const,
    }));

    await prisma.seat.createMany({
      data: seats,
    });

    console.log(`Created dinner: ${created.theme} (${created.status}) with ${dinner.seatCount} seats`);
  }

  console.log("✅ Dinners seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding dinners:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
