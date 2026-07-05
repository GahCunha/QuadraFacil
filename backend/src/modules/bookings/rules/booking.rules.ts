import { AppError } from "../../../shared/errors/AppError";

const MINUTES_IN_DAY = 24 * 60;

export type TimeInterval = {
  startsAt: Date;
  endsAt: Date;
};

export function ensureFutureBooking(startsAt: Date, now = new Date()): void {
  if (startsAt.getTime() <= now.getTime()) {
    throw new AppError("booking cannot start in the past");
  }
}

export function ensureValidInterval(startsAt: Date, endsAt: Date): void {
  if (startsAt.getTime() >= endsAt.getTime()) {
    throw new AppError("startsAt must be before endsAt");
  }
}

export function getUtcMinutesFromDate(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function ensureWithinCourtWorkingHours(
  startsAt: Date,
  endsAt: Date,
  court: {
    openingMinutes: number;
    closingMinutes: number;
  },
): void {
  const startMinutes = getUtcMinutesFromDate(startsAt);
  const endMinutes = getUtcMinutesFromDate(endsAt);

  if (startMinutes < court.openingMinutes || endMinutes > court.closingMinutes) {
    throw new AppError("booking is outside court working hours");
  }

  if (startMinutes >= endMinutes) {
    throw new AppError("booking must start and end on the same day");
  }
}

export function intervalsOverlap(left: TimeInterval, right: TimeInterval): boolean {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function ensureNoIntervalConflict(
  requestedInterval: TimeInterval,
  existingIntervals: TimeInterval[],
  message = "booking conflicts with an existing schedule",
): void {
  const hasConflict = existingIntervals.some((interval) => intervalsOverlap(requestedInterval, interval));

  if (hasConflict) {
    throw new AppError(message, 409);
  }
}

export function getWeekRange(date: Date): TimeInterval {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  start.setUTCDate(start.getUTCDate() - daysSinceMonday);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return {
    startsAt: start,
    endsAt: end,
  };
}

export function ensureWeeklyBookingLimit(currentBookingsInWeek: number, limit = 3): void {
  if (currentBookingsInWeek >= limit) {
    throw new AppError(`user cannot have more than ${limit} bookings per week`, 409);
  }
}

export function parseBookingDate(value: unknown, field: string): Date {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid ISO date`);
  }

  return date;
}

export function ensureMinutesWithinDay(minutes: number, field: string): void {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MINUTES_IN_DAY) {
    throw new AppError(`${field} must be between 0 and 1440`);
  }
}
