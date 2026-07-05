import type { BookingStatus } from "@prisma/client";

export type CreateBookingInput = {
  courtId: string;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type UpdateBookingStatusInput = {
  status: BookingStatus;
};
