import { SportType, type Court } from "@prisma/client";

import { prisma } from "../../../database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import type { CourtInput, CourtUpdateInput } from "../dtos/court.dtos";

const MINUTES_IN_DAY = 24 * 60;

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
    throw new AppError("optional text fields must be strings");
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function validateSportType(value: unknown): SportType {
  if (typeof value !== "string" || !Object.values(SportType).includes(value as SportType)) {
    throw new AppError("sportType is invalid");
  }

  return value as SportType;
}

function validateMinutes(value: unknown, field: string): number {
  if (!Number.isInteger(value)) {
    throw new AppError(`${field} must be an integer`);
  }

  const minutes = Number(value);

  if (minutes < 0 || minutes > MINUTES_IN_DAY) {
    throw new AppError(`${field} must be between 0 and 1440`);
  }

  return minutes;
}

function validateOpeningBeforeClosing(openingMinutes: number, closingMinutes: number): void {
  if (openingMinutes >= closingMinutes) {
    throw new AppError("openingMinutes must be lower than closingMinutes");
  }
}

function normalizeCreateInput(input: CourtInput) {
  const openingMinutes = validateMinutes(input.openingMinutes, "openingMinutes");
  const closingMinutes = validateMinutes(input.closingMinutes, "closingMinutes");

  validateOpeningBeforeClosing(openingMinutes, closingMinutes);

  return {
    name: validateRequiredString(input.name, "name"),
    description: normalizeOptionalString(input.description),
    sportType: validateSportType(input.sportType),
    location: normalizeOptionalString(input.location),
    openingMinutes,
    closingMinutes,
    isActive: input.isActive ?? true,
  };
}

function normalizeUpdateInput(input: CourtUpdateInput, currentCourt: Court) {
  const openingMinutes =
    input.openingMinutes === undefined
      ? currentCourt.openingMinutes
      : validateMinutes(input.openingMinutes, "openingMinutes");
  const closingMinutes =
    input.closingMinutes === undefined
      ? currentCourt.closingMinutes
      : validateMinutes(input.closingMinutes, "closingMinutes");

  validateOpeningBeforeClosing(openingMinutes, closingMinutes);

  return {
    name: input.name === undefined ? undefined : validateRequiredString(input.name, "name"),
    description: normalizeOptionalString(input.description),
    sportType: input.sportType === undefined ? undefined : validateSportType(input.sportType),
    location: normalizeOptionalString(input.location),
    openingMinutes: input.openingMinutes === undefined ? undefined : openingMinutes,
    closingMinutes: input.closingMinutes === undefined ? undefined : closingMinutes,
    isActive: input.isActive,
  };
}

export async function listCourts(): Promise<Court[]> {
  return prisma.court.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function listAllCourts(): Promise<Court[]> {
  return prisma.court.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCourtById(id: string): Promise<Court> {
  const court = await prisma.court.findUnique({
    where: {
      id,
    },
  });

  if (!court || !court.isActive) {
    throw new AppError("court not found", 404);
  }

  return court;
}

export async function createCourt(input: CourtInput): Promise<Court> {
  const data = normalizeCreateInput(input);

  return prisma.court.create({
    data,
  });
}

export async function updateCourt(id: string, input: CourtUpdateInput): Promise<Court> {
  const court = await prisma.court.findUnique({
    where: {
      id,
    },
  });

  if (!court) {
    throw new AppError("court not found", 404);
  }

  const data = normalizeUpdateInput(input, court);

  return prisma.court.update({
    where: {
      id,
    },
    data,
  });
}

export async function deactivateCourt(id: string): Promise<Court> {
  const court = await prisma.court.findUnique({
    where: {
      id,
    },
  });

  if (!court) {
    throw new AppError("court not found", 404);
  }

  return prisma.court.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
}
