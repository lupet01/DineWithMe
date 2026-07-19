import { NextRequest, NextResponse } from "next/server";
import { mutualInterestRepository, userRepository } from "@dinewithme/db";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "@/app/api/lib/error-handler";
import { requireAuth, isErrorResponse } from "@/lib/auth";

export interface Connection {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  dinnerId: string;
  dinnerTheme: string | null;
  dinnerDate: string;
  createdAt: string;
}

export interface ConnectionsResponse {
  success: boolean;
  data?: {
    connections: Connection[];
    count: number;
  };
  error?: {
    message: string;
    code: string;
  };
}

/**
 * GET /api/users/me/connections
 * 
 * Get user's mutual connections (mutual interests)
 * Returns only reciprocal matches where both users selected "would dine again"
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult.error;
    }
    const { user } = authResult;

    // Get database user
    const dbUser = await userRepository.findByAuthProviderId(user.clerkId);
    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found in database",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Get mutual interests for user
    const mutualInterests = await mutualInterestRepository.findByUser(dbUser.id);

    // Transform to connection format
    const connections: Connection[] = mutualInterests.map((mi) => {
      // Determine which user is the "other" user
      const isUserA = mi.userAId === dbUser.id;
      const otherUser = isUserA ? mi.userB : mi.userA;

      return {
        id: mi.id,
        userId: otherUser.id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        email: otherUser.email,
        avatarUrl: null, // Not stored in current schema
        dinnerId: mi.dinner.id,
        dinnerTheme: mi.dinner.theme?.title ?? null,
        dinnerDate: mi.dinner.startsAt.toISOString(),
        createdAt: mi.createdAt.toISOString(),
      };
    });

    // Sort by most recent first
    connections.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Track analytics
    try {
      await track(AnalyticsEvents.CONNECTIONS_VIEWED, {
        userId: dbUser.id,
        connectionCount: connections.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to track connections_viewed:", error);
    }

    const response: ConnectionsResponse = {
      success: true,
      data: {
        connections,
        count: connections.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
