import { CalendarClock, Clock3, Users, Volleyball } from "lucide-react";

import { EmptyState } from "../../components/admin/EmptyState";
import { MetricCard } from "../../components/admin/MetricCard";
import { BookingStatusBadge } from "../../components/admin/StatusBadge";
import type { Booking, Court } from "../../types/api";
import { formatDate, formatTime, isToday } from "./admin-formatters";

type DashboardPageProps = {
  courts: Court[];
  bookings: Booking[];
  isLoading: boolean;
};

export function DashboardPage({ courts, bookings, isLoading }: DashboardPageProps) {
  const todayBookings = bookings.filter((booking) => isToday(booking.startsAt));
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING");
  const knownUsers = new Set(bookings.map((booking) => booking.user?.id).filter(Boolean));
  const upcomingBookings = bookings
    .filter((booking) => new Date(booking.startsAt).getTime() >= Date.now())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total de quadras"
          value={courts.length}
          description="Quadras cadastradas no sistema"
          icon={Volleyball}
        />
        <MetricCard
          title="Reservas do dia"
          value={todayBookings.length}
          description="Agendamentos para hoje"
          icon={CalendarClock}
        />
        <MetricCard
          title="Reservas pendentes"
          value={pendingBookings.length}
          description="Aguardando aprovação"
          icon={Clock3}
        />
        <MetricCard
          title="Usuários cadastrados"
          value={knownUsers.size || "A definir"}
          description="Requer endpoint dedicado de usuários"
          icon={Users}
        />
      </section>

      <section className="rounded-md border border-border bg-background shadow-panel">
        <div className="flex flex-col gap-1 border-b border-border p-4">
          <h2 className="text-lg font-semibold">Próximas reservas</h2>
          <p className="text-sm text-muted-foreground">
            Lista baseada nas reservas carregadas do ambiente administrativo.
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Carregando reservas...</div>
        ) : upcomingBookings.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CalendarClock}
              title="Nenhuma reserva futura"
              description="Quando houver reservas futuras, elas aparecerão nesta lista."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Quadra</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Horário</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{booking.user?.name || "Cliente"}</td>
                    <td className="px-4 py-3">{booking.court?.name || booking.courtId}</td>
                    <td className="px-4 py-3">{formatDate(booking.startsAt)}</td>
                    <td className="px-4 py-3">
                      {formatTime(booking.startsAt)} - {formatTime(booking.endsAt)}
                    </td>
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
