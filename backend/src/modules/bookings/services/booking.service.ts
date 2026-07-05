import { BookingStatus, type Booking } from "@prisma/client";

import { prisma } from "../../../database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import type { CreateBookingInput, UpdateBookingStatusInput } from "../dtos/booking.dtos";
import {
  ensureFutureBooking,
  ensureNoIntervalConflict,
  ensureValidInterval,
  ensureWeeklyBookingLimit,
  ensureWithinCourtWorkingHours,
  getWeekRange,
  parseBookingDate,
} from "../rules/booking.rules";

const CONFLICTING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
];
const FINAL_BOOKING_STATUSES: BookingStatus[] = [BookingStatus.REJECTED, BookingStatus.CANCELLED];
const BOOKING_RELATIONS_INCLUDE = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  },
  court: true,
};

function validateRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required`);
  }

  return value.trim();
}

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("notes must be a string");
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function validateBookingStatus(value: unknown): BookingStatus {
  if (typeof value !== "string" || !Object.values(BookingStatus).includes(value as BookingStatus)) {
    throw new AppError("status is invalid");
  }

  return value as BookingStatus;
}

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
  now = new Date(),
): Promise<Booking> {
  const courtId = validateRequiredString(input.courtId, "courtId");
  const startsAt = parseBookingDate(input.startsAt, "startsAt");
  const endsAt = parseBookingDate(input.endsAt, "endsAt");
  const notes = normalizeOptionalString(input.notes);

  ensureValidInterval(startsAt, endsAt);
  ensureFutureBooking(startsAt, now);

  const [user, court] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
    }),
    prisma.court.findUnique({
      where: {
        id: courtId,
      },
    }),
  ]);

  if (!user || !user.isActive) {
    throw new AppError("user not found", 404);
  }

  if (!court || !court.isActive) {
    throw new AppError("court not found", 404);
  }

  ensureWithinCourtWorkingHours(startsAt, endsAt, court);

  const weekRange = getWeekRange(startsAt);

  const [weeklyBookingsCount, conflictingBookings, conflictingBlockedTimes] = await Promise.all([
    prisma.booking.count({
      where: {
        userId,
        status: {
          in: CONFLICTING_BOOKING_STATUSES,
        },
        startsAt: {
          gte: weekRange.startsAt,
          lt: weekRange.endsAt,
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        courtId,
        status: {
          in: CONFLICTING_BOOKING_STATUSES,
        },
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    }),
    prisma.blockedTime.findMany({
      where: {
        courtId,
        startsAt: {
          lt: endsAt,
        },
        endsAt: {
          gt: startsAt,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    }),
  ]);

  ensureWeeklyBookingLimit(weeklyBookingsCount);
  ensureNoIntervalConflict(
    { startsAt, endsAt },
    conflictingBookings,
    "booking conflicts with another booking",
  );
  ensureNoIntervalConflict(
    { startsAt, endsAt },
    conflictingBlockedTimes,
    "booking conflicts with a blocked time",
  );

  return prisma.booking.create({
    data: {
      userId,
      courtId,
      startsAt,
      endsAt,
      notes,
      status: BookingStatus.PENDING,
    },
  });
}

export async function listMyBookings(userId: string): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: {
      userId,
    },
    include: BOOKING_RELATIONS_INCLUDE,
    orderBy: {
      startsAt: "desc",
    },
  });
}

export async function listAllBookings(): Promise<Booking[]> {
  return prisma.booking.findMany({
    include: BOOKING_RELATIONS_INCLUDE,
    orderBy: {
      startsAt: "desc",
    },
  });
}

export async function updateBookingStatus(
  id: string,
  input: UpdateBookingStatusInput,
): Promise<Booking> {
  const status = validateBookingStatus(input.status);

  const booking = await prisma.booking.findUnique({
    where: {
      id,
    },
  });

  if (!booking) {
    throw new AppError("booking not found", 404);
  }

  if (FINAL_BOOKING_STATUSES.includes(booking.status)) {
    throw new AppError("final bookings cannot change status", 409);
  }

  if (status === BookingStatus.APPROVED) {
    const [conflictingBookings, conflictingBlockedTimes] = await Promise.all([
      prisma.booking.findMany({
        where: {
          id: {
            not: booking.id,
          },
          courtId: booking.courtId,
          status: {
            in: CONFLICTING_BOOKING_STATUSES,
          },
          startsAt: {
            lt: booking.endsAt,
          },
          endsAt: {
            gt: booking.startsAt,
          },
        },
        select: {
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.blockedTime.findMany({
        where: {
          courtId: booking.courtId,
          startsAt: {
            lt: booking.endsAt,
          },
          endsAt: {
            gt: booking.startsAt,
          },
        },
        select: {
          startsAt: true,
          endsAt: true,
        },
      }),
    ]);

    ensureNoIntervalConflict(
      { startsAt: booking.startsAt, endsAt: booking.endsAt },
      conflictingBookings,
      "booking conflicts with another booking",
    );
    ensureNoIntervalConflict(
      { startsAt: booking.startsAt, endsAt: booking.endsAt },
      conflictingBlockedTimes,
      "booking conflicts with a blocked time",
    );
  }

  return prisma.booking.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
}

export async function cancelBooking(id: string, userId: string, now = new Date()): Promise<Booking> {
  const booking = await prisma.booking.findUnique({
    where: {
      id,
    },
  });

  if (!booking || booking.userId !== userId) {
    throw new AppError("booking not found", 404);
  }

  if (FINAL_BOOKING_STATUSES.includes(booking.status)) {
    throw new AppError("final bookings cannot be cancelled", 409);
  }

  if (booking.startsAt.getTime() <= now.getTime()) {
    throw new AppError("past bookings cannot be cancelled", 409);
  }

  return prisma.booking.update({
    where: {
      id,
    },
    data: {
      status: BookingStatus.CANCELLED,
    },
  });
}
