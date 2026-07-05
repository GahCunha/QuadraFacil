import type { BookingStatus } from "../../types/api";

const bookingStatusStyles: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${bookingStatusStyles[status]}`}
    >
      {bookingStatusLabels[status]}
    </span>
  );
}

export function CourtStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${
        isActive
          ? "border-emerald-200 bg-emerald-100 text-emerald-800"
          : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {isActive ? "Ativa" : "Inativa"}
    </span>
  );
}
