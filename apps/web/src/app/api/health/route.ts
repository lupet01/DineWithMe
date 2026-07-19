import { NextResponse } from 'next/server';
import { db } from '@dinewithme/db';

export async function GET() {
  const checks = {
    database: false,
    bookingRate: false,
    timestamp: new Date().toISOString(),
  };
  
  const issues: string[] = [];
  
  // Check database connection
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    issues.push('Database connection failed');
    console.error('[Health Check] Database error:', error);
  }
  
  // Check booking success rate (last hour)
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const totalBookings = await db.seat.count({
      where: { 
        createdAt: { gte: hourAgo },
        status: { in: ['HELD', 'CONFIRMED', 'CANCELLED', 'EXPIRED'] }
      },
    });
    
    const confirmedBookings = await db.seat.count({
      where: {
        createdAt: { gte: hourAgo },
        status: 'CONFIRMED',
      },
    });
    
    const rate = totalBookings > 0 ? confirmedBookings / totalBookings : 1;
    checks.bookingRate = rate >= 0.5; // 50% threshold
    
    if (!checks.bookingRate && totalBookings > 10) {
      issues.push(`Low booking confirmation rate: ${(rate * 100).toFixed(1)}% (${confirmedBookings}/${totalBookings})`);
    }
  } catch (error) {
    issues.push('Could not check booking rate');
    console.error('[Health Check] Booking rate error:', error);
  }
  
  const healthy = issues.length === 0;
  
  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      issues,
      timestamp: checks.timestamp,
    },
    { status: healthy ? 200 : 503 }
  );
}
