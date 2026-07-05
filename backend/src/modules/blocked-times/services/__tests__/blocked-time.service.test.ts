import { beforeEach, describe, expect, it, vi } from "vitest";
import { SportType, type BlockedTime, type Court } from "@prisma/client";

import {
  createBlockedTime,
  deleteBlockedTime,
  listBlockedTimes,
  listBlockedTimesByCourt,
} from "../blocked-time.service";

const prismaMock = vi.hoisted(() => ({
  court: {
    findUnique: vi.fn(),
  },
  booking: {
    findMany: vi.fn(),
  },
  blockedTime: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
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
    closingMinutes: 1320,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeBlockedTime(overrides: Partial<BlockedTime> = {}): BlockedTime {
  return {
    id: "blocked-time-id",
    courtId: "court-id",
    startsAt: new Date("2026-07-06T09:00:00.000Z"),
    endsAt: new Date("2026-07-06T10:00:00.000Z"),
    reason: "Manutencao",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("blocked-time.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.court.findUnique.mockResolvedValue(makeCourt());
    prismaMock.booking.findMany.mockResolvedValue([]);
    prismaMock.blockedTime.findMany.mockResolvedValue([]);
    prismaMock.blockedTime.create.mockResolvedValue(makeBlockedTime());
  });

  describe("createBlockedTime", () => {
    it("creates a blocked time when rules pass", async () => {
      await expect(
        createBlockedTime(
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
            reason: " Manutencao ",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).resolves.toEqual(makeBlockedTime());

      expect(prismaMock.blockedTime.create).toHaveBeenCalledWith({
        data: {
          courtId: "court-id",
          startsAt: new Date("2026-07-06T09:00:00.000Z"),
          endsAt: new Date("2026-07-06T10:00:00.000Z"),
          reason: "Manutencao",
        },
      });
    });

    it("rejects blocked time in the past", async () => {
      await expect(
        createBlockedTime(
          {
            courtId: "court-id",
            startsAt: "2026-07-04T09:00:00.000Z",
            endsAt: "2026-07-04T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "booking cannot start in the past",
        statusCode: 400,
      });
      expect(prismaMock.court.findUnique).not.toHaveBeenCalled();
    });

    it("rejects inactive courts", async () => {
      prismaMock.court.findUnique.mockResolvedValue(
        makeCourt({
          isActive: false,
        }),
      );

      await expect(
        createBlockedTime(
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "court not found",
        statusCode: 404,
      });
    });

    it("rejects conflicts with bookings", async () => {
      prismaMock.booking.findMany.mockResolvedValue([
        {
          startsAt: new Date("2026-07-06T09:30:00.000Z"),
          endsAt: new Date("2026-07-06T10:30:00.000Z"),
        },
      ]);

      await expect(
        createBlockedTime(
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "blocked time conflicts with an existing booking",
        statusCode: 409,
      });
    });

    it("rejects conflicts with other blocked times", async () => {
      prismaMock.blockedTime.findMany.mockResolvedValue([
        {
          startsAt: new Date("2026-07-06T09:30:00.000Z"),
          endsAt: new Date("2026-07-06T10:30:00.000Z"),
        },
      ]);

      await expect(
        createBlockedTime(
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "blocked time conflicts with another blocked time",
        statusCode: 409,
      });
    });
  });

  it("lists blocked times", async () => {
    const blockedTimes = [makeBlockedTime()];
    prismaMock.blockedTime.findMany.mockResolvedValue(blockedTimes);

    await expect(listBlockedTimes()).resolves.toEqual(blockedTimes);
    expect(prismaMock.blockedTime.findMany).toHaveBeenCalledWith({
      orderBy: {
        startsAt: "desc",
      },
    });
  });

  it("lists blocked times by court", async () => {
    const blockedTimes = [makeBlockedTime()];
    prismaMock.blockedTime.findMany.mockResolvedValue(blockedTimes);

    await expect(listBlockedTimesByCourt("court-id")).resolves.toEqual(blockedTimes);
    expect(prismaMock.blockedTime.findMany).toHaveBeenCalledWith({
      where: {
        courtId: "court-id",
      },
      orderBy: {
        startsAt: "desc",
      },
    });
  });

  it("deletes an existing blocked time", async () => {
    const blockedTime = makeBlockedTime();
    prismaMock.blockedTime.findUnique.mockResolvedValue(blockedTime);
    prismaMock.blockedTime.delete.mockResolvedValue(blockedTime);

    await expect(deleteBlockedTime("blocked-time-id")).resolves.toEqual(blockedTime);
  });

  it("rejects deleting missing blocked time", async () => {
    prismaMock.blockedTime.findUnique.mockResolvedValue(null);

    await expect(deleteBlockedTime("missing-id")).rejects.toMatchObject({
      message: "blocked time not found",
      statusCode: 404,
    });
  });
});
