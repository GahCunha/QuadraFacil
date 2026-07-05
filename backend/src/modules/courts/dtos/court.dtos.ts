import type { SportType } from "@prisma/client";

export type CourtInput = {
  name: string;
  description?: string | null;
  sportType: SportType;
  location?: string | null;
  openingMinutes: number;
  closingMinutes: number;
  isActive?: boolean;
};

export type CourtUpdateInput = Partial<CourtInput>;
