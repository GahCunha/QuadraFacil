export type CreateBlockedTimeInput = {
  courtId: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
};
