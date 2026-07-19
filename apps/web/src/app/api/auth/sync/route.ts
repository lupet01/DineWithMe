import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@dinewithme/db';

/**
 * POST /api/auth/sync
 * 
 * Sync Clerk user to database
 * Called by SyncUser component on every page load
 * Idempotent - safe to call multiple times
 */
export async function POST() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { authProviderId: clerkUser.id },
    });

    if (existingUser) {
      // User already synced
      return NextResponse.json({ 
        success: true, 
        user: existingUser,
        message: 'User already synced'
      });
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        authProviderId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        role: 'DINER', // Default role
      },
    });

    console.log('[Sync] Created new user:', newUser.id);

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      message: 'User synced successfully'
    });
  } catch (error) {
    console.error('[Sync] Error syncing user:', error);
    return NextResponse.json(
      { 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to sync user' 
        } 
      },
      { status: 500 }
    );
  }
}
