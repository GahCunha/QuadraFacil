import { describe, expect, it } from "vitest";

import {
  ensureFutureBooking,
  ensureNoIntervalConflict,
  ensureValidInterval,
  ensureWeeklyBookingLimit,
  ensureWithinCourtWorkingHours,
  getUtcMinutesFromDate,
  getWeekRange,
  intervalsOverlap,
  parseBookingDate,
} from "../booking.rules";

describe("booking.rules", () => {
  it("rejects bookings in the past", () => {
    expect(() =>
      ensureFutureBooking(
        new Date("2026-07-05T09:00:00.000Z"),
        new Date("2026-07-05T10:00:00.000Z"),
      ),
    ).toThrow("booking cannot start in the past");
  });

  it("rejects invalid intervals", () => {
    expect(() =>
      ensureValidInterval(
        new Date("2026-07-05T10:00:00.000Z"),
        new Date("2026-07-05T10:00:00.000Z"),
      ),
    ).toThrow("startsAt must be before endsAt");
  });

  it("gets UTC minutes from date", () => {
    expect(getUtcMinutesFromDate(new Date("2026-07-05T09:30:00.000Z"))).toBe(570);
  });

  it("accepts bookings inside court working hours", () => {
    expect(() =>
      ensureWithinCourtWorkingHours(
        new Date("2026-07-05T09:00:00.000Z"),
        new Date("2026-07-05T10:00:00.000Z"),
        {
          openingMinutes: 480,
          closingMinutes: 1320,
        },
      ),
    ).not.toThrow();
  });

  it("rejects bookings before opening time", () => {
    expect(() =>
      ensureWithinCourtWorkingHours(
        new Date("2026-07-05T07:30:00.000Z"),
        new Date("2026-07-05T08:30:00.000Z"),
        {
          openingMinutes: 480,
          closingMinutes: 1320,
        },
      ),
    ).toThrow("booking is outside court working hours");
  });

  it("rejects bookings after closing time", () => {
    expect(() =>
      ensureWithinCourtWorkingHours(
        new Date("2026-07-05T21:30:00.000Z"),
        new Date("2026-07-05T22:30:00.000Z"),
        {
          openingMinutes: 480,
          closingMinutes: 1320,
        },
      ),
    ).toThrow("booking is outside court working hours");
  });

  it("detects exact interval overlap", () => {
    expect(
      intervalsOverlap(
        {
          startsAt: new Date("2026-07-05T09:00:00.000Z"),
          endsAt: new Date("2026-07-05T10:00:00.000Z"),
        },
        {
          startsAt: new Date("2026-07-05T09:00:00.000Z"),
          endsAt: new Date("2026-07-05T10:00:00.000Z"),
        },
      ),
    ).toBe(true);
  });

  it("detects partial interval overlap", () => {
    expect(
      intervalsOverlap(
        {
          startsAt: new Date("2026-07-05T09:00:00.000Z"),
          endsAt: new Date("2026-07-05T10:00:00.000Z"),
        },
        {
          startsAt: new Date("2026-07-05T09:30:00.000Z"),
          endsAt: new Date("2026-07-05T10:30:00.000Z"),
        },
      ),
    ).toBe(true);
  });

  it("allows adjacent intervals", () => {
    expect(
      intervalsOverlap(
        {
          startsAt: new Date("2026-07-05T09:00:00.000Z"),
          endsAt: new Date("2026-07-05T10:00:00.000Z"),
        },
        {
          startsAt: new Date("2026-07-05T10:00:00.000Z"),
          endsAt: new Date("2026-07-05T11:00:00.000Z"),
        },
      ),
    ).toBe(false);
  });

  it("rejects conflicting intervals", () => {
    expect(() =>
      ensureNoIntervalConflict(
        {
          startsAt: new Date("2026-07-05T09:00:00.000Z"),
          endsAt: new Date("2026-07-05T10:00:00.000Z"),
        },
        [
          {
            startsAt: new Date("2026-07-05T09:30:00.000Z"),
            endsAt: new Date("2026-07-05T10:30:00.000Z"),
          },
        ],
      ),
    ).toThrow("booking conflicts with an existing schedule");
  });

  it("calculates week range starting on Monday", () => {
    const range = getWeekRange(new Date("2026-07-05T12:00:00.000Z"));

    expect(range.startsAt.toISOString()).toBe("2026-06-29T00:00:00.000Z");
    expect(range.endsAt.toISOString()).toBe("2026-07-06T00:00:00.000Z");
  });

  it("rejects weekly booking limit", () => {
    expect(() => ensureWeeklyBookingLimit(3)).toThrow(
      "user cannot have more than 3 bookings per week",
    );
  });

  it("parses ISO dates", () => {
    expect(parseBookingDate("2026-07-05T09:00:00.000Z", "startsAt").toISOString()).toBe(
      "2026-07-05T09:00:00.000Z",
    );
  });

  it("rejects invalid dates", () => {
    expect(() => parseBookingDate("invalid", "startsAt")).toThrow(
      "startsAt must be a valid ISO date",
    );
  });
});
