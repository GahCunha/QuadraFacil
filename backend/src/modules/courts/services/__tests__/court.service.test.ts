import { beforeEach, describe, expect, it, vi } from "vitest";
import { SportType, type Court } from "@prisma/client";

import {
  createCourt,
  deactivateCourt,
  getCourtById,
  listAllCourts,
  listCourts,
  updateCourt,
} from "../court.service";

const prismaMock = vi.hoisted(() => ({
  court: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../../../database/prisma", () => ({
  prisma: prismaMock,
}));

function makeCourt(overrides: Partial<Court> = {}): Court {
  return {
    id: "court-id",
    name: "Quadra Futsal",
    description: "Quadra coberta.",
    sportType: SportType.FUTSAL,
    location: "Ginasio",
    openingMinutes: 480,
    closingMinutes: 1320,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("court.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCourts", () => {
    it("lists active courts ordered by name", async () => {
      const courts = [makeCourt()];

      prismaMock.court.findMany.mockResolvedValue(courts);

      await expect(listCourts()).resolves.toEqual(courts);
      expect(prismaMock.court.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    });
  });

  describe("listAllCourts", () => {
    it("lists all courts ordered by name", async () => {
      const courts = [makeCourt()];

      prismaMock.court.findMany.mockResolvedValue(courts);

      await expect(listAllCourts()).resolves.toEqual(courts);
      expect(prismaMock.court.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });
  });

  describe("getCourtById", () => {
    it("returns an active court", async () => {
      const court = makeCourt();

      prismaMock.court.findUnique.mockResolvedValue(court);

      await expect(getCourtById(court.id)).resolves.toEqual(court);
    });

    it("rejects inactive courts", async () => {
      prismaMock.court.findUnique.mockResolvedValue(
        makeCourt({
          isActive: false,
        }),
      );

      await expect(getCourtById("inactive-id")).rejects.toMatchObject({
        message: "court not found",
        statusCode: 404,
      });
    });
  });

  describe("createCourt", () => {
    it("creates a court with normalized fields", async () => {
      const court = makeCourt({
        name: "Quadra Society",
        sportType: SportType.SOCIETY,
      });

      prismaMock.court.create.mockResolvedValue(court);

      await expect(
        createCourt({
          name: " Quadra Society ",
          description: " Campo sintetico ",
          sportType: SportType.SOCIETY,
          location: " Area externa ",
          openingMinutes: 480,
          closingMinutes: 1320,
        }),
      ).resolves.toEqual(court);
      expect(prismaMock.court.create).toHaveBeenCalledWith({
        data: {
          name: "Quadra Society",
          description: "Campo sintetico",
          sportType: SportType.SOCIETY,
          location: "Area externa",
          openingMinutes: 480,
          closingMinutes: 1320,
          isActive: true,
        },
      });
    });

    it("rejects invalid sportType", async () => {
      await expect(
        createCourt({
          name: "Quadra",
          sportType: "INVALID" as SportType,
          openingMinutes: 480,
          closingMinutes: 1320,
        }),
      ).rejects.toMatchObject({
        message: "sportType is invalid",
        statusCode: 400,
      });
    });

    it("rejects invalid working hours", async () => {
      await expect(
        createCourt({
          name: "Quadra",
          sportType: SportType.FUTSAL,
          openingMinutes: 1320,
          closingMinutes: 480,
        }),
      ).rejects.toMatchObject({
        message: "openingMinutes must be lower than closingMinutes",
        statusCode: 400,
      });
    });
  });

  describe("updateCourt", () => {
    it("updates an existing court", async () => {
      const currentCourt = makeCourt();
      const updatedCourt = makeCourt({
        name: "Quadra Atualizada",
      });

      prismaMock.court.findUnique.mockResolvedValue(currentCourt);
      prismaMock.court.update.mockResolvedValue(updatedCourt);

      await expect(
        updateCourt(currentCourt.id, {
          name: " Quadra Atualizada ",
          description: "",
        }),
      ).resolves.toEqual(updatedCourt);
      expect(prismaMock.court.update).toHaveBeenCalledWith({
        where: {
          id: currentCourt.id,
        },
        data: {
          name: "Quadra Atualizada",
          description: null,
          sportType: undefined,
          location: undefined,
          openingMinutes: undefined,
          closingMinutes: undefined,
          isActive: undefined,
        },
      });
    });

    it("rejects missing court update", async () => {
      prismaMock.court.findUnique.mockResolvedValue(null);

      await expect(
        updateCourt("missing-id", {
          name: "Quadra",
        }),
      ).rejects.toMatchObject({
        message: "court not found",
        statusCode: 404,
      });
    });
  });

  describe("deactivateCourt", () => {
    it("deactivates an existing court", async () => {
      const court = makeCourt();
      const inactiveCourt = makeCourt({
        isActive: false,
      });

      prismaMock.court.findUnique.mockResolvedValue(court);
      prismaMock.court.update.mockResolvedValue(inactiveCourt);

      await expect(deactivateCourt(court.id)).resolves.toEqual(inactiveCourt);
      expect(prismaMock.court.update).toHaveBeenCalledWith({
        where: {
          id: court.id,
        },
        data: {
          isActive: false,
        },
      });
    });
  });
});
