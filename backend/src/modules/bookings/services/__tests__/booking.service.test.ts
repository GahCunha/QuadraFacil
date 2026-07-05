import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingStatus, Role, SportType, type Booking, type Court, type User } from "@prisma/client";

import {
  cancelBooking,
  createBooking,
  listAllBookings,
  listMyBookings,
  updateBookingStatus,
} from "../booking.service";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  court: {
    findUnique: vi.fn(),
  },
  booking: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  blockedTime: {
    findMany: vi.fn(),
  },
}));

vi.mock("../../../../database/prisma", () => ({
  prisma: prismaMock,
}));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-id",
    name: "Usuario",
    email: "user@quadrafacil.com",
    passwordHash: "hash",
    role: Role.USER,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

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

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-id",
    userId: "user-id",
    courtId: "court-id",
    startsAt: new Date("2026-07-06T09:00:00.000Z"),
    endsAt: new Date("2026-07-06T10:00:00.000Z"),
    status: BookingStatus.PENDING,
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("booking.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    prismaMock.court.findUnique.mockResolvedValue(makeCourt());
    prismaMock.booking.count.mockResolvedValue(0);
    prismaMock.booking.findMany.mockResolvedValue([]);
    prismaMock.blockedTime.findMany.mockResolvedValue([]);
    prismaMock.booking.create.mockResolvedValue(makeBooking());
  });

  describe("createBooking", () => {
    it("creates a pending booking when all rules pass", async () => {
      const now = new Date("2026-07-05T09:00:00.000Z");

      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
            notes: " Treino ",
          },
          now,
        ),
      ).resolves.toEqual(makeBooking());

      expect(prismaMock.booking.create).toHaveBeenCalledWith({
        data: {
          userId: "user-id",
          courtId: "court-id",
          startsAt: new Date("2026-07-06T09:00:00.000Z"),
          endsAt: new Date("2026-07-06T10:00:00.000Z"),
          notes: "Treino",
          status: BookingStatus.PENDING,
        },
      });
    });

    it("rejects past bookings before querying dependencies", async () => {
      await expect(
        createBooking(
          "user-id",
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
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("rejects inactive users", async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        makeUser({
          isActive: false,
        }),
      );

      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "user not found",
        statusCode: 404,
      });
    });

    it("rejects inactive courts", async () => {
      prismaMock.court.findUnique.mockResolvedValue(
        makeCourt({
          isActive: false,
        }),
      );

      await expect(
        createBooking(
          "user-id",
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

    it("rejects bookings outside court hours", async () => {
      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T07:00:00.000Z",
            endsAt: "2026-07-06T08:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "booking is outside court working hours",
        statusCode: 400,
      });
    });

    it("rejects weekly booking limit", async () => {
      prismaMock.booking.count.mockResolvedValue(3);

      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "user cannot have more than 3 bookings per week",
        statusCode: 409,
      });
    });

    it("rejects booking conflicts", async () => {
      prismaMock.booking.findMany.mockResolvedValue([
        {
          startsAt: new Date("2026-07-06T09:30:00.000Z"),
          endsAt: new Date("2026-07-06T10:30:00.000Z"),
        },
      ]);

      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "booking conflicts with another booking",
        statusCode: 409,
      });
    });

    it("rejects blocked time conflicts", async () => {
      prismaMock.blockedTime.findMany.mockResolvedValue([
        {
          startsAt: new Date("2026-07-06T09:30:00.000Z"),
          endsAt: new Date("2026-07-06T10:30:00.000Z"),
        },
      ]);

      await expect(
        createBooking(
          "user-id",
          {
            courtId: "court-id",
            startsAt: "2026-07-06T09:00:00.000Z",
            endsAt: "2026-07-06T10:00:00.000Z",
          },
          new Date("2026-07-05T09:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        message: "booking conflicts with a blocked time",
        statusCode: 409,
      });
    });
  });

  it("lists current user bookings", async () => {
    const bookings = [makeBooking()];
    prismaMock.booking.findMany.mockResolvedValue(bookings);

    await expect(listMyBookings("user-id")).resolves.toEqual(bookings);
    expect(prismaMock.booking.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-id",
      },
      orderBy: {
        startsAt: "desc",
      },
    });
  });

  it("lists all bookings", async () => {
    const bookings = [makeBooking()];
    prismaMock.booking.findMany.mockResolvedValue(bookings);

    await expect(listAllBookings()).resolves.toEqual(bookings);
  });

  it("updates booking status", async () => {
    const booking = makeBooking();
    const approvedBooking = makeBooking({
      status: BookingStatus.APPROVED,
    });

    prismaMock.booking.findUnique.mockResolvedValue(booking);
    prismaMock.booking.update.mockResolvedValue(approvedBooking);

    await expect(
      updateBookingStatus("booking-id", {
        status: BookingStatus.APPROVED,
      }),
    ).resolves.toEqual(approvedBooking);
  });

  it("rejects changing final booking status", async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBooking({
        status: BookingStatus.CANCELLED,
      }),
    );

    await expect(
      updateBookingStatus("booking-id", {
        status: BookingStatus.APPROVED,
      }),
    ).rejects.toMatchObject({
      message: "final bookings cannot change status",
      statusCode: 409,
    });
  });

  it("cancels own booking", async () => {
    const booking = makeBooking();
    const cancelledBooking = makeBooking({
      status: BookingStatus.CANCELLED,
    });

    prismaMock.booking.findUnique.mockResolvedValue(booking);
    prismaMock.booking.update.mockResolvedValue(cancelledBooking);

    await expect(cancelBooking("booking-id", "user-id")).resolves.toEqual(cancelledBooking);
  });

  it("does not cancel bookings from another user", async () => {
    prismaMock.booking.findUnique.mockResolvedValue(
      makeBooking({
        userId: "other-user",
      }),
    );

    await expect(cancelBooking("booking-id", "user-id")).rejects.toMatchObject({
      message: "booking not found",
      statusCode: 404,
    });
  });
});
