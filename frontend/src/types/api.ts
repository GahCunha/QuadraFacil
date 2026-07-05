export type BookingStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type Court = {
  id: string;
  name: string;
  description: string | null;
  sportType: string;
  location: string | null;
  openingMinutes: number;
  closingMinutes: number;
  isActive: boolean;
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export type AuthResponse = {
  token: string;
  user: UserSummary;
};

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  available: boolean;
  reason?: "PAST" | "BOOKING" | "BLOCKED_TIME";
};

export type DailyAvailability = {
  date: string;
  slots: AvailabilitySlot[];
};

export type AvailabilityResponse = {
  courtId: string;
  openingMinutes: number;
  closingMinutes: number;
  slotMinutes: number;
  days: DailyAvailability[];
};

export type Booking = {
  id: string;
  userId: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  notes: string | null;
  user?: UserSummary;
  court?: Court;
};

export type BlockedTime = {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  court?: Court;
};

export type CourtsResponse = {
  courts: Court[];
};

export type BookingsResponse = {
  bookings: Booking[];
};

export type BookingResponse = {
  booking: Booking;
};

export type BlockedTimesResponse = {
  blockedTimes: BlockedTime[];
};
