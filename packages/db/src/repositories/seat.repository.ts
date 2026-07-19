import type { Seat, Prisma, SeatStatus } from "@prisma/client";
import { BaseRepository } from "./base";
import { createSeatStateMachine } from "../services/seat-state-machine";

export class SeatRepository extends BaseRepository<Seat> {
  async findById(id: string): Promise<Seat | null> {
    return this.prisma.seat.findUnique({
      where: { id },
    });
  }

  async findMany(): Promise<Seat[]> {
    return this.prisma.seat.findMany();
  }

  async findByDinner(dinnerId: string): Promise<Seat[]> {
    return this.prisma.seat.findMany({
      where: { dinnerId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByDinnerWithStatus(
    dinnerId: string,
    status: SeatStatus
  ): Promise<Seat[]> {
    return this.prisma.seat.findMany({
      where: {
        dinnerId,
        status,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async findByUser(userId: string): Promise<Seat[]> {
    return this.prisma.seat.findMany({
      where: {
        OR: [
          { heldByUserId: userId },
          { confirmedByUserId: userId },
        ],
      },
      include: {
        dinner: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Every seat that's ever been claimed (held, booked, cancelled, no-show
   * - anything but untouched AVAILABLE) across every dinner at a
   * restaurant, with the guest, dinner, and latest payment details a
   * restaurant admin's Guests & Bookings screen needs (incl. its
   * Upcoming/Past/Cancelled tabs and Payment column, which need HELD and
   * CANCELLED rows visible too, not just booked ones). Filtering by
   * name/status/dinner happens client-side (same pattern as
   * restaurants-table.tsx) - this returns the full restaurant-scoped set
   * in one query.
   */
  async findGuestsByRestaurant(restaurantId: string): Promise<
    Array<
      Seat & {
        confirmedByUser: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
        } | null;
        heldByUser: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string;
        } | null;
        dinner: {
          id: string;
          startsAt: Date;
          theme: { title: string } | null;
        };
        paymentIntents: Array<{
          status: string;
          amount: number;
          currency: string;
        }>;
      }
    >
  > {
    return this.prisma.seat.findMany({
      where: {
        status: { not: "AVAILABLE" },
        dinner: { restaurantId },
      },
      include: {
        confirmedByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        heldByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        dinner: {
          select: {
            id: true,
            startsAt: true,
            theme: { select: { title: true } },
          },
        },
        paymentIntents: {
          select: { status: true, amount: true, currency: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { dinner: { startsAt: "desc" } },
    });
  }

  /**
   * Find seats for a specific dinner and user
   */
  async findByDinnerAndUser(dinnerId: string, userId: string): Promise<Seat[]> {
    return this.prisma.seat.findMany({
      where: {
        dinnerId,
        OR: [
          { heldByUserId: userId },
          { confirmedByUserId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find user's dinners (confirmed, attended, completed seats)
   * Returns dinners with seat information for the user
   */
  async findUserDinners(userId: string): Promise<Array<{
    seat: Seat;
    dinner: any;
  }>> {
    const seats = await this.prisma.seat.findMany({
      where: {
        confirmedByUserId: userId,
        status: {
          in: ["CONFIRMED", "ATTENDED", "COMPLETED"],
        },
      },
      include: {
        dinner: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                cuisine: true,
                city: true,
                address: true,
                heroImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        dinner: {
          startsAt: "desc",
        },
      },
    });

    return seats.map((seat) => ({
      seat,
      dinner: seat.dinner,
    }));
  }

  async countAvailableForDinner(dinnerId: string): Promise<number> {
    const now = new Date();
    return this.prisma.seat.count({
      where: {
        dinnerId,
        OR: [
          { status: "AVAILABLE" },
          { status: "HELD", holdExpiresAt: { lte: now } },
        ],
      },
    });
  }

  async countActiveHoldsForDinner(dinnerId: string): Promise<number> {
    const now = new Date();
    return this.prisma.seat.count({
      where: {
        dinnerId,
        status: "HELD",
        holdExpiresAt: { gt: now },
      },
    });
  }

  async countByDinnerAndStatus(
    dinnerId: string,
    status: SeatStatus
  ): Promise<number> {
    return this.prisma.seat.count({
      where: {
        dinnerId,
        status,
      },
    });
  }

  async create(data: Prisma.SeatCreateInput): Promise<Seat> {
    return this.prisma.seat.create({
      data,
    });
  }

  async createMany(data: Prisma.SeatCreateManyInput[]): Promise<number> {
    const result = await this.prisma.seat.createMany({
      data,
    });
    return result.count;
  }

  async update(id: string, data: Prisma.SeatUpdateInput): Promise<Seat> {
    return this.prisma.seat.update({
      where: { id },
      data,
    });
  }

  /**
   * Hold a seat for a dinner (atomic operation)
   * 
   * Finds the first available seat for a dinner and holds it for the user.
   * Uses a transaction to prevent race conditions.
   * Uses state machine for transition.
   * 
   * @param userId - ID of the user holding the seat
   * @param dinnerId - ID of the dinner
   * @param holdDurationMinutes - How long to hold the seat (default: 10 minutes)
   * @param dietaryNotes - Optional dietary notes captured from the booking form
   * @returns The held seat
   * @throws Error if no seats available or user already has a hold
   */
  async holdSeatForDinner(
    userId: string,
    dinnerId: string,
    holdDurationMinutes: number = 10,
    dietaryNotes?: string | null
  ): Promise<Seat> {
    return this.prisma.$transaction(async (tx) => {
      // Check if user already has a hold or confirmation for this dinner
      const existingHold = await tx.seat.findFirst({
        where: {
          dinnerId,
          OR: [
            { heldByUserId: userId, status: "HELD" },
            { confirmedByUserId: userId, status: "CONFIRMED" },
          ],
        },
      });

      if (existingHold) {
        throw new Error("User already has a seat for this dinner");
      }

      // Find first available seat (FIFO)
      // Also treat expired holds as available — no cron needed
      const availableSeat = await tx.seat.findFirst({
        where: {
          dinnerId,
          OR: [
            { status: "AVAILABLE" },
            {
              status: "HELD",
              holdExpiresAt: { lte: new Date() },
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!availableSeat) {
        throw new Error("No available seats for this dinner");
      }

      // If we grabbed an expired hold, reset it first — guarded so that if another
      // concurrent transaction already reset/re-held this exact expired hold,
      // this affects zero rows instead of racing it.
      if (availableSeat.status === "HELD") {
        const { count } = await tx.seat.updateMany({
          where: {
            id: availableSeat.id,
            status: "HELD",
            holdExpiresAt: { lte: new Date() },
          },
          data: {
            status: "AVAILABLE",
            heldByUserId: null,
            holdExpiresAt: null,
            updatedAt: new Date(),
          },
        });

        if (count === 0) {
          throw new Error("No available seats for this dinner");
        }
      }

      // Calculate hold expiration
      const holdExpiresAt = new Date();
      holdExpiresAt.setMinutes(holdExpiresAt.getMinutes() + holdDurationMinutes);

      // Use state machine for transition (within transaction context)
      const stateMachine = createSeatStateMachine(tx as any);
      const result = await stateMachine.transitionSeatStatus(
        availableSeat.id,
        "HELD",
        {
          userId,
          heldByUserId: userId,
          holdExpiresAt,
          holdDurationMinutes,
          dinnerId,
          dietaryNotes,
        }
      );

      return result.seat;
    });
  }

  /**
   * Confirm a held seat
   * 
   * Validates:
   * - Seat exists
   * - Seat is HELD
   * - User owns the hold
   * - Hold has not expired
   * 
   * Uses state machine for transition.
   * 
   * @param seatId - ID of the seat to confirm
   * @param userId - ID of the user confirming
   * @returns Updated seat with CONFIRMED status
   * @throws Error if validation fails
   */
  /**
   * Confirm a seat
   *
   * IMPORTANT: This method should ONLY be called by the payment webhook handler,
   * or (with requirePayment: false) by the free-dinner booking path where no
   * PaymentIntent is ever created in the first place.
   *
   * Requirements:
   * - Seat must be HELD
   * - Seat must be held by the specified user
   * - Hold must not be expired
   * - Payment must be SUCCEEDED, unless requirePayment is false
   *
   * @param seatId - ID of the seat to confirm
   * @param userId - ID of the user confirming the seat
   * @param options.requirePayment - Set false for $0 dinners, which never get a
   *   PaymentIntent row. Defaults to true so the paid path stays as strict as before.
   * @returns Confirmed seat
   * @throws Error if validation fails
   */
  async confirmSeat(
    seatId: string,
    userId: string,
    options: { requirePayment?: boolean } = {}
  ): Promise<Seat> {
    const { requirePayment = true } = options;

    const seat = await this.findById(seatId);
    if (!seat) {
      throw new Error("Seat not found");
    }

    if (seat.status !== "HELD") {
      throw new Error(`Seat is not held. Current status: ${seat.status}`);
    }

    if (seat.heldByUserId !== userId) {
      throw new Error("Seat is held by a different user");
    }

    // Check if hold has expired
    if (seat.holdExpiresAt && seat.holdExpiresAt <= new Date()) {
      throw new Error("Seat hold has expired");
    }

    if (requirePayment) {
      // CRITICAL: Verify payment has succeeded
      // This check ensures seats can only be confirmed after payment
      const paymentIntent = await this.prisma.paymentIntent.findFirst({
        where: { seatId },
        orderBy: { createdAt: 'desc' }, // Get most recent payment intent
      });

      if (!paymentIntent) {
        throw new Error("No payment intent found for this seat. Payment is required to confirm seat.");
      }

      if (paymentIntent.status !== "SUCCEEDED") {
        throw new Error(
          `Payment has not succeeded. Current payment status: ${paymentIntent.status}. ` +
          `Seats can only be confirmed after successful payment.`
        );
      }
    }

    // Use state machine for transition
    const stateMachine = createSeatStateMachine(this.prisma);
    const result = await stateMachine.transitionSeatStatus(
      seatId,
      "CONFIRMED",
      {
        userId,
        confirmedByUserId: userId,
        dinnerId: seat.dinnerId,
      }
    );

    return result.seat;
  }

  /**
   * Cancel a confirmed seat
   * 
   * Validates:
   * - Seat exists
   * - Seat is CONFIRMED
   * - User owns the confirmation
   * - Cancellation is within policy (hours before dinner)
   * 
   * Uses state machine for transition.
   * 
   * @param seatId - ID of the seat to cancel
   * @param userId - ID of the user cancelling
   * @returns Updated seat with CANCELLED status (or AVAILABLE if policy allows)
   * @throws Error if validation fails or policy denies cancellation
   */
  async cancelSeat(seatId: string, userId: string): Promise<{
    seat: Seat;
    policyResult: { allowed: boolean; reason?: string; hoursUntilDinner?: number };
  }> {
    const seat = await this.findById(seatId);
    if (!seat) {
      throw new Error("Seat not found");
    }

    if (seat.status !== "CONFIRMED") {
      throw new Error(`Seat is not confirmed. Current status: ${seat.status}`);
    }

    if (seat.confirmedByUserId !== userId) {
      throw new Error("Seat is confirmed by a different user");
    }

    // Get dinner to check start time
    const dinner = await this.prisma.dinner.findUnique({
      where: { id: seat.dinnerId },
      select: { startsAt: true },
    });

    if (!dinner) {
      throw new Error("Dinner not found");
    }

    // Import policy check dynamically to avoid circular dependencies
    const { isCancellationAllowed, seatCancellationPolicy } = await import("@dinewithme/config");
    const policyResult = isCancellationAllowed(dinner.startsAt);

    if (!policyResult.allowed) {
      throw new Error(policyResult.reason || "Cancellation not allowed");
    }

    // Determine new status based on policy
    const newStatus = seatCancellationPolicy.autoReleaseCancelledSeats 
      ? "AVAILABLE" 
      : "CANCELLED";

    // Use state machine for transition
    const stateMachine = createSeatStateMachine(this.prisma);
    const result = await stateMachine.transitionSeatStatus(
      seatId,
      newStatus,
      {
        userId,
        confirmedByUserId: seatCancellationPolicy.retainConfirmedUserOnCancel ? undefined : null,
        heldByUserId: null,
        hoursUntilDinner: policyResult.hoursUntilDinner,
        reason: "user_cancelled",
        dinnerId: seat.dinnerId,
      }
    );

    return {
      seat: result.seat,
      policyResult,
    };
  }

  /**
   * Check in a diner (mark seat as attended)
   * 
   * Validates:
   * - Seat exists
   * - Seat is CONFIRMED
   * - User owns the confirmation
   * - Check-in is within time window (30 min before to 30 min after start)
   * 
   * Uses state machine for transition.
   * 
   * @param seatId - ID of the seat
   * @param userId - ID of the user checking in
   * @returns Updated seat with ATTENDED status
   * @throws Error if validation fails or outside time window
   */
  async checkIn(seatId: string, userId: string): Promise<{
    seat: Seat;
    policyResult: { allowed: boolean; reason?: string; minutesUntilStart?: number };
  }> {
    const seat = await this.findById(seatId);
    if (!seat) {
      throw new Error("Seat not found");
    }

    if (seat.status !== "CONFIRMED") {
      throw new Error(`Cannot check in. Seat status: ${seat.status}`);
    }

    if (seat.confirmedByUserId !== userId) {
      throw new Error("Seat is confirmed by a different user");
    }

    // Get dinner to check start time
    const dinner = await this.prisma.dinner.findUnique({
      where: { id: seat.dinnerId },
      select: { startsAt: true },
    });

    if (!dinner) {
      throw new Error("Dinner not found");
    }

    // Import policy check dynamically to avoid circular dependencies
    const { isCheckInAllowed } = await import("@dinewithme/config");
    const policyResult = isCheckInAllowed(dinner.startsAt);

    if (!policyResult.allowed) {
      throw new Error(policyResult.reason || "Check-in not allowed");
    }

    // Use state machine for transition
    const stateMachine = createSeatStateMachine(this.prisma);
    const result = await stateMachine.transitionSeatStatus(
      seatId,
      "ATTENDED",
      {
        userId,
        checkedInAt: new Date(),
        minutesUntilStart: policyResult.minutesUntilStart,
        dinnerId: seat.dinnerId,
      }
    );

    return {
      seat: result.seat,
      policyResult,
    };
  }

  /**
   * Expire all held seats that have passed their expiration time
   * Returns details about expired seats for analytics/logging
   * Uses state machine for transitions.
   */
  async expireHolds(): Promise<{ count: number; expiredSeats: Array<{ id: string; dinnerId: string; heldByUserId: string | null }> }> {
    // First, find all expired holds
    const expiredSeats = await this.prisma.seat.findMany({
      where: {
        status: "HELD",
        holdExpiresAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        dinnerId: true,
        heldByUserId: true,
      },
    });

    if (expiredSeats.length === 0) {
      return { count: 0, expiredSeats: [] };
    }

    // Use state machine to transition each seat
    const stateMachine = createSeatStateMachine(this.prisma);
    
    for (const seat of expiredSeats) {
      try {
        await stateMachine.transitionSeatStatus(
          seat.id,
          "AVAILABLE",
          {
            userId: "system",
            heldByUserId: seat.heldByUserId,
            dinnerId: seat.dinnerId,
            reason: "hold_expired",
          }
        );
      } catch (error) {
        console.error(`Failed to expire hold for seat ${seat.id}:`, error);
      }
    }

    return { count: expiredSeats.length, expiredSeats };
  }

  async delete(id: string): Promise<Seat> {
    return this.prisma.seat.delete({
      where: { id },
    });
  }

  /**
   * Mark no-shows for dinners that have started
   * 
   * Finds all CONFIRMED seats where:
   * - Dinner has started
   * - No check-in recorded
   * - Past the no-show threshold (e.g., 30 minutes after start)
   * 
   * Uses state machine for transitions.
   * 
   * @param thresholdMinutes - Minutes after dinner start to mark as no-show (default: 30)
   * @returns Array of marked seats with user IDs
   */
  async markNoShows(thresholdMinutes: number = 30): Promise<Array<{
    seatId: string;
    userId: string;
    dinnerId: string;
    dinnerTheme: string;
  }>> {
    const now = new Date();
    const thresholdTime = new Date(now.getTime() - thresholdMinutes * 60 * 1000);

    // Find all CONFIRMED seats where dinner started more than threshold ago
    // and user hasn't checked in
    const noShowSeats = await this.prisma.seat.findMany({
      where: {
        status: "CONFIRMED",
        checkedInAt: null,
        confirmedByUserId: { not: null },
        dinner: {
          startsAt: {
            lte: thresholdTime, // Dinner started at least threshold minutes ago
          },
          status: {
            in: ["SCHEDULED", "LIVE"], // Only active dinners
          },
        },
      },
      include: {
        dinner: {
          select: {
            id: true,
            theme: { select: { title: true } },
            startsAt: true,
          },
        },
      },
    });

    if (noShowSeats.length === 0) {
      return [];
    }

    // Use state machine to mark each as NO_SHOW
    const stateMachine = createSeatStateMachine(this.prisma);
    const results: Array<{
      seatId: string;
      userId: string;
      dinnerId: string;
      dinnerTheme: string;
    }> = [];

    for (const seat of noShowSeats) {
      try {
        const minutesAfterStart = Math.floor(
          (now.getTime() - seat.dinner.startsAt.getTime()) / (60 * 1000)
        );

        await stateMachine.transitionSeatStatus(
          seat.id,
          "NO_SHOW",
          {
            userId: seat.confirmedByUserId!,
            dinnerId: seat.dinner.id,
            dinnerTheme: seat.dinner.theme.title,
            minutesAfterStart,
            reason: "no_check_in",
          }
        );

        results.push({
          seatId: seat.id,
          userId: seat.confirmedByUserId!,
          dinnerId: seat.dinner.id,
          dinnerTheme: seat.dinner.theme.title,
        });
      } catch (error) {
        console.error(`Failed to mark no-show for seat ${seat.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Count total booked seats (CONFIRMED + ATTENDED + COMPLETED) vs all seats
   * ever created (for platform analytics fill rate). Aggregated in the
   * database via count() - does not load rows into memory.
   */
  async countBookedVsTotal(): Promise<{ booked: number; total: number }> {
    const [booked, total] = await Promise.all([
      this.prisma.seat.count({
        where: {
          status: { in: ["CONFIRMED", "ATTENDED", "COMPLETED"] },
        },
      }),
      this.prisma.seat.count(),
    ]);

    return { booked, total };
  }

  /**
   * Restaurant-scoped stats for the admin dashboard: count of currently
   * booked/attended seats and the number of distinct guests who have ever
   * held a confirmed seat at this restaurant. Both aggregated in the
   * database - does not load seat rows into memory.
   */
  async getRestaurantStats(
    restaurantId: string
  ): Promise<{ activeSeats: number; totalGuests: number }> {
    const bookedStatuses: SeatStatus[] = ["CONFIRMED", "ATTENDED", "COMPLETED"];

    const [activeSeats, distinctGuests] = await Promise.all([
      this.prisma.seat.count({
        where: {
          status: { in: bookedStatuses },
          dinner: { restaurantId },
        },
      }),
      this.prisma.seat.findMany({
        where: {
          status: { in: bookedStatuses },
          dinner: { restaurantId },
          confirmedByUserId: { not: null },
        },
        select: { confirmedByUserId: true },
        distinct: ["confirmedByUserId"],
      }),
    ]);

    return { activeSeats, totalGuests: distinctGuests.length };
  }
}
