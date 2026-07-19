import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  try {
    // Check connection
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check critical tables exist
    const tables = [
      'users',
      'restaurants', 
      'dinners',
      'seats',
      'payment_intents',
      'webhook_events', // New table for Phase 0
    ];
    
    for (const table of tables) {
      const result = await db.$queryRawUnsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        );
      `);
      
      const exists = (result as any)[0].exists;
      if (exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    // Count records
    console.log('\n📊 Record counts:');
    const userCount = await db.user.count();
    const restaurantCount = await db.restaurant.count();
    const dinnerCount = await db.dinner.count();
    const seatCount = await db.seat.count();
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Restaurants: ${restaurantCount}`);
    console.log(`  Dinners: ${dinnerCount}`);
    console.log(`  Seats: ${seatCount}`);
    
    console.log('\n✅ Database verification complete!');
    console.log('\n🎯 Ready for Phase 0 testing:');
    console.log('  1. npm run test:concurrent-bookings');
    console.log('  2. npm run dev (test user sync)');
    console.log('  3. npm run migrate:pre-deployment (optional)');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

verifyDatabase();
