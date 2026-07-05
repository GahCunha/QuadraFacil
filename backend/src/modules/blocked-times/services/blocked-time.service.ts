import { BookingStatus, type BlockedTime } from "@prisma/client";

import { prisma } from "../../../database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import type { CreateBlockedTimeInput } from "../dtos/blocked-time.dtos";
import {
  ensureFutureBooking,
  ensureNoIntervalConflict,
  ensureValidInterval,
  ensureWithinCourtWorkingHours,
  parseBookingDate,
} from "../../bookings/rules/booking.rules";

const CONFLICTING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
];

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
    throw new AppError("reason must be a string");
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function createBlockedTime(
  input: CreateBlockedTimeInput,
  now = new Date(),
): Promise<BlockedTime> {
  const courtId = validateRequiredString(input.courtId, "courtId");
  const startsAt = parseBookingDate(input.startsAt, "startsAt");
  const endsAt = parseBookingDate(input.endsAt, "endsAt");
  const reason = normalizeOptionalString(input.reason);

  ensureValidInterval(startsAt, endsAt);
  ensureFutureBooking(startsAt, now);

  const court = await prisma.court.findUnique({
    where: {
      id: courtId,
    },
  });

  if (!court || !court.isActive) {
    throw new AppError("court not found", 404);
  }

  ensureWithinCourtWorkingHours(startsAt, endsAt, court);

  const [conflictingBookings, conflictingBlockedTimes] = await Promise.all([
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

  ensureNoIntervalConflict(
    { startsAt, endsAt },
    conflictingBookings,
    "blocked time conflicts with an existing booking",
  );
  ensureNoIntervalConflict(
    { startsAt, endsAt },
    conflictingBlockedTimes,
    "blocked time conflicts with another blocked time",
  );

  return prisma.blockedTime.create({
    data: {
      courtId,
      startsAt,
      endsAt,
      reason,
    },
  });
}

export async function listBlockedTimes(): Promise<BlockedTime[]> {
  return prisma.blockedTime.findMany({
    orderBy: {
      startsAt: "desc",
    },
  });
}

export async function listBlockedTimesByCourt(courtId: string): Promise<BlockedTime[]> {
  validateRequiredString(courtId, "courtId");

  return prisma.blockedTime.findMany({
    where: {
      courtId,
    },
    orderBy: {
      startsAt: "desc",
    },
  });
}

export async function deleteBlockedTime(id: string): Promise<BlockedTime> {
  const blockedTime = await prisma.blockedTime.findUnique({
    where: {
      id,
    },
  });

  if (!blockedTime) {
    throw new AppError("blocked time not found", 404);
  }

  return prisma.blockedTime.delete({
    where: {
      id,
    },
  });
}
