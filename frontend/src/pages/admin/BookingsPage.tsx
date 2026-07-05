import { CalendarClock, Eye, ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../components/admin/Button";
import { EmptyState } from "../../components/admin/EmptyState";
import { BookingStatusBadge } from "../../components/admin/StatusBadge";
import type { Booking, BookingStatus } from "../../types/api";
import { formatDate, formatTime } from "./admin-formatters";

type BookingFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

type BookingsPageProps = {
  bookings: Booking[];
  isLoading: boolean;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
};

const filters: Array<{ id: BookingFilter; label: string }> = [
  { id: "ALL", label: "Todas" },
  { id: "PENDING", label: "Pendentes" },
  { id: "APPROVED", label: "Aprovadas" },
  { id: "REJECTED", label: "Rejeitadas" },
];

export function BookingsPage({ bookings, isLoading, onUpdateStatus }: BookingsPageProps) {
  const [activeFilter, setActiveFilter] = useState<BookingFilter>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (activeFilter === "ALL") {
      return bookings;
    }

    return bookings.filter((booking) => booking.status === activeFilter);
  }, [activeFilter, bookings]);

  async function updateStatus(bookingId: string, status: BookingStatus) {
    setUpdatingId(bookingId);

    try {
      await onUpdateStatus(bookingId, status);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reservas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe solicitações e aprove ou rejeite reservas pendentes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
          Carregando reservas...
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhuma reserva encontrada"
          description="Ajuste os filtros ou aguarde novas solicitações de agendamento."
        />
      ) : (
        <section className="rounded-md border border-border bg-background shadow-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Quadra</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Horário</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{booking.user?.name || "Cliente"}</div>
                      <div className="text-xs text-muted-foreground">{booking.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">{booking.court?.name || booking.courtId}</td>
                    <td className="px-4 py-3">{formatDate(booking.startsAt)}</td>
                    <td className="px-4 py-3">
                      {formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-9"
                          variant="secondary"
                          disabled={updatingId === booking.id}
                          onClick={() => void updateStatus(booking.id, "APPROVED")}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          className="h-9"
                          variant="danger"
                          disabled={updatingId === booking.id}
                          onClick={() => void updateStatus(booking.id, "REJECTED")}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Rejeitar
                        </Button>
                        <Button className="h-9" variant="ghost">
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
