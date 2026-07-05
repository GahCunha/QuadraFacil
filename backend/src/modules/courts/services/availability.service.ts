import { BookingStatus, type Court } from "@prisma/client";

import { prisma } from "../../../database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { intervalsOverlap, type TimeInterval } from "../../bookings/rules/booking.rules";

const DEFAULT_SLOT_MINUTES = 60;
const MIN_SLOT_MINUTES = 15;
const MAX_SLOT_MINUTES = 240;
const CONFLICTING_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.APPROVED,
];

type AvailabilityReason = "PAST" | "BOOKING" | "BLOCKED_TIME";

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: AvailabilityReason;
};

export type DailyAvailability = {
  date: string;
  slots: AvailabilitySlot[];
};

export type AvailabilityResult = {
  courtId: string;
  openingMinutes: number;
  closingMinutes: number;
  slotMinutes: number;
  days: DailyAvailability[];
};

type AvailabilityQuery = {
  date?: unknown;
  month?: unknown;
  slotMinutes?: unknown;
};

function parseSlotMinutes(value: unknown): number {
  if (value === undefined) {
    return DEFAULT_SLOT_MINUTES;
  }

  const slotMinutes = Number(value);

  if (
    !Number.isInteger(slotMinutes) ||
    slotMinutes < MIN_SLOT_MINUTES ||
    slotMinutes > MAX_SLOT_MINUTES
  ) {
    throw new AppError("slotMinutes must be an integer between 15 and 240");
  }

  return slotMinutes;
}

function parseDateOnly(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError("date must use YYYY-MM-DD format");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError("date must be a valid date");
  }

  return date;
}

function parseMonth(value: unknown): { year: number; monthIndex: number } {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    throw new AppError("month must use YYYY-MM format");
  }

  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError("month must be a valid month");
  }

  return {
    year,
    monthIndex: month - 1,
  };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(query: AvailabilityQuery): Date[] {
  if (query.date && query.month) {
    throw new AppError("use either date or month, not both");
  }

  if (query.date) {
    return [parseDateOnly(query.date)];
  }

  const { year, monthIndex } = parseMonth(query.month ?? getDateKey(new Date()).slice(0, 7));
  const firstDay = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const days: Date[] = [];

  for (
    let current = new Date(firstDay);
    current.getUTCMonth() === monthIndex;
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    days.push(new Date(current));
  }

  return days;
}

function buildDayBounds(days: Date[]): TimeInterval {
  const startsAt = days[0];
  const endsAt = new Date(days[days.length - 1]);
  endsAt.setUTCDate(endsAt.getUTCDate() + 1);

  return {
    startsAt,
    endsAt,
  };
}

function buildSlotInterval(day: Date, startMinutes: number, slotMinutes: number): TimeInterval {
  const startsAt = addMinutes(day, startMinutes);
  const endsAt = addMinutes(startsAt, slotMinutes);

  return {
    startsAt,
    endsAt,
  };
}

function findUnavailableReason(
  slot: TimeInterval,
  bookings: TimeInterval[],
  blockedTimes: TimeInterval[],
  now: Date,
): AvailabilityReason | undefined {
  if (slot.startsAt.getTime() <= now.getTime()) {
    return "PAST";
  }

  if (bookings.some((booking) => intervalsOverlap(slot, booking))) {
    return "BOOKING";
  }

  if (blockedTimes.some((blockedTime) => intervalsOverlap(slot, blockedTime))) {
    return "BLOCKED_TIME";
  }

  return undefined;
}

function buildDailyAvailability(
  court: Court,
  day: Date,
  slotMinutes: number,
  bookings: TimeInterval[],
  blockedTimes: TimeInterval[],
  now: Date,
): DailyAvailability {
  const slots: AvailabilitySlot[] = [];

  for (
    let currentMinutes = court.openingMinutes;
    currentMinutes + slotMinutes <= court.closingMinutes;
    currentMinutes += slotMinutes
  ) {
    const slot = buildSlotInterval(day, currentMinutes, slotMinutes);
    const reason = findUnavailableReason(slot, bookings, blockedTimes, now);

    slots.push({
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      available: !reason,
      ...(reason ? { reason } : {}),
    });
  }

  return {
    date: getDateKey(day),
    slots,
  };
}

export async function getCourtAvailability(
  courtId: string,
  query: AvailabilityQuery,
  now = new Date(),
): Promise<AvailabilityResult> {
  const slotMinutes = parseSlotMinutes(query.slotMinutes);
  const days = buildDateRange(query);
  const range = buildDayBounds(days);

  const court = await prisma.court.findUnique({
    where: {
      id: courtId,
    },
  });

  if (!court || !court.isActive) {
    throw new AppError("court not found", 404);
  }

  if (court.openingMinutes + slotMinutes > court.closingMinutes) {
    throw new AppError("slotMinutes does not fit court working hours");
  }

  const [bookings, blockedTimes] = await Promise.all([
    prisma.booking.findMany({
      where: {
        courtId,
        status: {
          in: CONFLICTING_BOOKING_STATUSES,
        },
        startsAt: {
          lt: range.endsAt,
        },
        endsAt: {
          gt: range.startsAt,
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
          lt: range.endsAt,
        },
        endsAt: {
          gt: range.startsAt,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    }),
  ]);

  return {
    courtId,
    openingMinutes: court.openingMinutes,
    closingMinutes: court.closingMinutes,
    slotMinutes,
    days: days.map((day) =>
      buildDailyAvailability(court, day, slotMinutes, bookings, blockedTimes, now),
    ),
  };
}
