import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingStatus, SportType, type Court } from "@prisma/client";

import { getCourtAvailability } from "../availability.service";

const prismaMock = vi.hoisted(() => ({
  court: {
    findUnique: vi.fn(),
  },
  booking: {
    findMany: vi.fn(),
  },
  blockedTime: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../../../database/prisma", () => ({
  prisma: prismaMock,
}));

function makeCourt(overrides: Partial<Court> = {}): Court {
  return {
    id: "court-id",
    name: "Quadra",
    description: null,
    sportType: SportType.FUTSAL,
    location: null,
    openingMinutes: 480,
    closingMinutes: 660,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("availability.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.court.findUnique.mockResolvedValue(makeCourt());
    prismaMock.booking.findMany.mockResolvedValue([]);
    prismaMock.blockedTime.findMany.mockResolvedValue([]);
  });

  it("returns daily available slots", async () => {
    const result = await getCourtAvailability(
      "court-id",
      {
        date: "2026-07-10",
        slotMinutes: "60",
      },
      new Date("2026-07-09T12:00:00.000Z"),
    );

    expect(result).toMatchObject({
      courtId: "court-id",
      openingMinutes: 480,
      closingMinutes: 660,
      slotMinutes: 60,
    });
    expect(result.days).toHaveLength(1);
    expect(result.days[0].date).toBe("2026-07-10");
    expect(result.days[0].slots).toEqual([
      {
        startsAt: "2026-07-10T08:00:00.000Z",
        endsAt: "2026-07-10T09:00:00.000Z",
        available: true,
      },
      {
        startsAt: "2026-07-10T09:00:00.000Z",
        endsAt: "2026-07-10T10:00:00.000Z",
        available: true,
      },
      {
        startsAt: "2026-07-10T10:00:00.000Z",
        endsAt: "2026-07-10T11:00:00.000Z",
        available: true,
      },
    ]);
  });

  it("marks booking conflicts as unavailable", async () => {
    prismaMock.booking.findMany.mockResolvedValue([
      {
        startsAt: new Date("2026-07-10T09:00:00.000Z"),
        endsAt: new Date("2026-07-10T10:00:00.000Z"),
      },
    ]);

    const result = await getCourtAvailability(
      "court-id",
      {
        date: "2026-07-10",
        slotMinutes: 60,
      },
      new Date("2026-07-09T12:00:00.000Z"),
    );

    expect(result.days[0].slots[1]).toMatchObject({
      available: false,
      reason: "BOOKING",
    });
  });

  it("marks blocked time conflicts as unavailable", async () => {
    prismaMock.blockedTime.findMany.mockResolvedValue([
      {
        startsAt: new Date("2026-07-10T10:00:00.000Z"),
        endsAt: new Date("2026-07-10T11:00:00.000Z"),
      },
    ]);

    const result = await getCourtAvailability(
      "court-id",
      {
        date: "2026-07-10",
        slotMinutes: 60,
      },
      new Date("2026-07-09T12:00:00.000Z"),
    );

    expect(result.days[0].slots[2]).toMatchObject({
      available: false,
      reason: "BLOCKED_TIME",
    });
  });

  it("marks past slots as unavailable", async () => {
    const result = await getCourtAvailability(
      "court-id",
      {
        date: "2026-07-10",
        slotMinutes: 60,
      },
      new Date("2026-07-10T09:30:00.000Z"),
    );

    expect(result.days[0].slots[0]).toMatchObject({
      available: false,
      reason: "PAST",
    });
    expect(result.days[0].slots[1]).toMatchObject({
      available: false,
      reason: "PAST",
    });
  });

  it("returns all days for a month", async () => {
    const result = await getCourtAvailability(
      "court-id",
      {
        month: "2026-02",
        slotMinutes: 60,
      },
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(result.days).toHaveLength(28);
    expect(result.days[0].date).toBe("2026-02-01");
    expect(result.days[27].date).toBe("2026-02-28");
  });

  it("queries bookings and blocked times for the selected range", async () => {
    await getCourtAvailability(
      "court-id",
      {
        date: "2026-07-10",
        slotMinutes: 60,
      },
      new Date("2026-07-09T12:00:00.000Z"),
    );

    expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
      where: {
        courtId: "court-id",
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED],
        },
        startsAt: {
          lt: new Date("2026-07-11T00:00:00.000Z"),
        },
        endsAt: {
          gt: new Date("2026-07-10T00:00:00.000Z"),
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    });
  });

  it("rejects invalid slot minutes", async () => {
    await expect(
      getCourtAvailability("court-id", {
        date: "2026-07-10",
        slotMinutes: 5,
      }),
    ).rejects.toMatchObject({
      message: "slotMinutes must be an integer between 15 and 240",
      statusCode: 400,
    });
  });

  it("rejects missing court", async () => {
    prismaMock.court.findUnique.mockResolvedValue(null);

    await expect(
      getCourtAvailability("court-id", {
        date: "2026-07-10",
      }),
    ).rejects.toMatchObject({
      message: "court not found",
      statusCode: 404,
    });
  });
});
