import {
  CheckCircle2,
  Clock,
  History,
  LogOut,
  MapPin,
  NotebookText,
  Send,
  Volleyball,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPatch, apiPost } from "@/api/http";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  AvailabilityResponse,
  Booking,
  BookingResponse,
  BookingsResponse,
  Court,
  CourtsResponse,
  UserSummary,
} from "@/types/api";
import {
  formatCourtType,
  formatDate,
  formatTime,
  getCurrentMonth,
} from "./customer-formatters";

type CustomerPortalProps = {
  token: string;
  user: UserSummary;
  onLogout: () => void;
};

const statusLabels: Record<Booking["status"], string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
  CANCELLED: "Cancelada",
};

const statusClasses: Record<Booking["status"], string> = {
  PENDING: "border-amber-200 bg-amber-100 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-100 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-100 text-rose-800",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-700",
};

const unavailableReasonLabels: Record<string, string> = {
  PAST: "Encerrado",
  BOOKING: "Reservado",
  BLOCKED_TIME: "Bloqueado",
};

function BookingStatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function canCancelBooking(booking: Booking): boolean {
  return (
    booking.status !== "CANCELLED" &&
    booking.status !== "REJECTED" &&
    new Date(booking.startsAt).getTime() > Date.now()
  );
}

function monthToLocalDate(month: string): Date {
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(year, monthNumber - 1, 1);
}

function localDateToDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function localDateToMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function dateKeyToLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function CustomerPortal({ token, user, onLogout }: CustomerPortalProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [calendarMonth, setCalendarMonth] = useState(() => monthToLocalDate(getCurrentMonth()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === selectedCourtId) || null,
    [courts, selectedCourtId],
  );

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => new Date(booking.startsAt).getTime() >= Date.now())
        .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()),
    [bookings],
  );

  const selectedDateKey = selectedDate ? localDateToDateKey(selectedDate) : null;

  const selectedDayAvailability = useMemo(
    () => availability?.days.find((day) => day.date === selectedDateKey) || null,
    [availability?.days, selectedDateKey],
  );

  const selectedDaySlots = useMemo(
    () => selectedDayAvailability?.slots || [],
    [selectedDayAvailability],
  );

  const selectedDayAvailableSlotsCount = useMemo(
    () => selectedDaySlots.filter((slot) => slot.available).length,
    [selectedDaySlots],
  );

  const availableDateKeys = useMemo(
    () =>
      new Set(
        availability?.days
          .filter((day) => day.slots.some((slot) => slot.available))
          .map((day) => day.date) || [],
      ),
    [availability?.days],
  );

  const availableCalendarDates = useMemo(
    () => Array.from(availableDateKeys).map(dateKeyToLocalDate),
    [availableDateKeys],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoadingCourts(true);
        setIsLoadingBookings(true);
        const [courtsResponse, bookingsResponse] = await Promise.all([
          apiGet<CourtsResponse>("/courts"),
          apiGet<BookingsResponse>("/bookings/me", { token }),
        ]);

        if (!isMounted) {
          return;
        }

        setCourts(courtsResponse.courts);
        setBookings(bookingsResponse.bookings);
        setSelectedCourtId((current) => current || courtsResponse.courts[0]?.id || "");
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar dados");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourts(false);
          setIsLoadingBookings(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedCourtId) {
      setAvailability(null);
      return;
    }

    let isMounted = true;

    async function loadAvailability() {
      try {
        setIsLoadingAvailability(true);
        setSelectedSlot(null);
        const params = new URLSearchParams({
          month: selectedMonth,
          slotMinutes: "60",
        });
        const response = await apiGet<AvailabilityResponse>(
          `/courts/${selectedCourtId}/availability?${params.toString()}`,
        );

        if (isMounted) {
          setAvailability(response);
          setSelectedDate((currentDate) => {
            const currentDateKey = currentDate ? localDateToDateKey(currentDate) : null;

            if (currentDateKey && response.days.some((day) => day.date === currentDateKey)) {
              return currentDate;
            }

            const firstAvailableDay = response.days.find((day) =>
              day.slots.some((slot) => slot.available),
            );

            return firstAvailableDay ? dateKeyToLocalDate(firstAvailableDay.date) : undefined;
          });
        }
      } catch (loadError) {
        if (isMounted) {
          setAvailability(null);
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar horarios");
        }
      } finally {
        if (isMounted) {
          setIsLoadingAvailability(false);
        }
      }
    }

    void loadAvailability();

    return () => {
      isMounted = false;
    };
  }, [selectedCourtId, selectedMonth]);

  async function refreshBookings() {
    const response = await apiGet<BookingsResponse>("/bookings/me", { token });
    setBookings(response.bookings);
  }

  async function requestBooking() {
    if (!selectedCourtId || !selectedSlot) {
      setError("Selecione uma quadra e um horario disponivel.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await apiPost<BookingResponse>(
        "/bookings",
        {
          courtId: selectedCourtId,
          startsAt: selectedSlot.startsAt,
          endsAt: selectedSlot.endsAt,
          notes: notes.trim() || null,
        },
        token,
      );

      setNotes("");
      setSelectedSlot(null);
      setSuccessMessage("Solicitacao enviada. Aguarde a aprovacao.");
      await refreshBookings();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao solicitar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    try {
      setError(null);
      await apiPatch<BookingResponse>(`/bookings/${bookingId}/cancel`, {}, token);
      setSuccessMessage("Reserva cancelada.");
      await refreshBookings();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Erro ao cancelar reserva");
    }
  }

  function renderSchedule() {
    return (
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar agendamento</CardTitle>
            <CardDescription>Escolha a quadra, selecione um dia no calendario e veja os horarios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor="court">Quadra</Label>
                  <select
                    id="court"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={selectedCourtId}
                    onChange={(event) => setSelectedCourtId(event.target.value)}
                    disabled={isLoadingCourts}
                  >
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
                  <p className="font-medium">Mes consultado</p>
                  <p className="mt-1 text-muted-foreground">{selectedMonth}</p>
                </div>
              </div>

              {selectedCourt ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Volleyball className="h-4 w-4" />
                      Modalidade
                    </div>
                    <p className="mt-1 font-semibold">{formatCourtType(selectedCourt.sportType)}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Local
                    </div>
                    <p className="mt-1 font-semibold">{selectedCourt.location || "Nao informado"}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Duracao
                    </div>
                    <p className="mt-1 font-semibold">60 minutos</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Calendario e horarios</CardTitle>
              <CardDescription>Os dias destacados possuem horarios livres para solicitacao.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAvailability ? (
                <p className="text-sm text-muted-foreground">Carregando horarios...</p>
              ) : availability && availability.days.length > 0 ? (
                <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                  <Card size="sm" className="w-full">
                    <CardContent className="p-4">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        month={calendarMonth}
                        onMonthChange={(month) => {
                          setCalendarMonth(month);
                          setSelectedMonth(localDateToMonthKey(month));
                          setSelectedDate(undefined);
                          setSelectedSlot(null);
                        }}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        disabled={(date) => !availableDateKeys.has(localDateToDateKey(date))}
                        modifiers={{
                          available: availableCalendarDates,
                        }}
                        modifiersClassNames={{
                          available:
                            "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                        }}
                        showOutsideDays={false}
                        className="mx-auto w-full max-w-sm p-0 [--cell-size:2.75rem] sm:[--cell-size:3rem]"
                        classNames={{
                          root: "w-full",
                          month: "flex w-full flex-col gap-4",
                          month_grid: "w-full border-separate border-spacing-1",
                          weekdays: "grid grid-cols-7",
                          weekday:
                            "flex h-8 items-center justify-center rounded-md text-xs font-medium text-muted-foreground",
                          week: "mt-1 grid grid-cols-7",
                          day: "relative aspect-square p-0 text-center",
                        }}
                      />
                    </CardContent>
                  </Card>

                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-4 flex flex-col gap-1">
                      <h3 className="font-semibold">
                        {selectedDateKey
                          ? `Horarios de ${formatDate(`${selectedDateKey}T00:00:00.000Z`)}`
                          : "Selecione um dia"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedDaySlots.length > 0
                          ? `${selectedDayAvailableSlotsCount} de ${selectedDaySlots.length} horarios disponiveis`
                          : "Nenhum horario livre para o dia selecionado"}
                      </p>
                    </div>

                    {selectedDaySlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {selectedDaySlots.map((slot) => {
                          const isSelected = selectedSlot?.startsAt === slot.startsAt;

                          return (
                            <button
                              key={slot.startsAt}
                              className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-2 text-sm font-medium transition ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : slot.available
                                    ? "border-border bg-background hover:bg-muted"
                                    : "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-70"
                              }`}
                              type="button"
                              disabled={!slot.available}
                              onClick={() =>
                                setSelectedSlot({
                                  startsAt: slot.startsAt,
                                  endsAt: slot.endsAt,
                                })
                              }
                            >
                              <span>{formatTime(slot.startsAt)}</span>
                              {!slot.available ? (
                                <span className="mt-0.5 text-[11px] font-normal">
                                  {slot.reason ? unavailableReasonLabels[slot.reason] : "Indisponivel"}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        Escolha um dia destacado no calendario para ver os horarios livres.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum horario disponivel.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da solicitacao</CardTitle>
              <CardDescription>Confira os dados antes de enviar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Quadra</p>
                <p className="mt-1 font-semibold">{selectedCourt?.name || "Selecione uma quadra"}</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">Horario</p>
                <p className="mt-1 font-semibold">
                  {selectedSlot
                    ? `${formatDate(selectedSlot.startsAt)} - ${formatTime(selectedSlot.startsAt)}`
                    : "Selecione um horario"}
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="notes">Observacoes</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Treino, aula pratica, evento interno..."
                  />
                </InputGroup>
              </Field>
              <Button className="h-10 w-full" disabled={!selectedSlot || isSubmitting} onClick={requestBooking}>
                <Send className="h-4 w-4" />
                Solicitar reserva
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proximas reservas</CardTitle>
              <CardDescription>Suas solicitacoes futuras.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma reserva futura.</p>
              ) : (
                upcomingBookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{booking.court?.name || booking.courtId}</p>
                        <p className="mt-1 text-muted-foreground">
                          {formatDate(booking.startsAt)} as {formatTime(booking.startsAt)}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    );
  }

  function renderHistory() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historico de reservas</CardTitle>
          <CardDescription>Acompanhe suas solicitacoes e reservas anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBookings ? (
            <p className="text-sm text-muted-foreground">Carregando historico...</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <History className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">Nenhuma reserva encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Suas solicitacoes aparecem aqui depois do envio.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <article key={booking.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{booking.court?.name || booking.courtId}</h3>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatDate(booking.startsAt)} das {formatTime(booking.startsAt)} as{" "}
                        {formatTime(booking.endsAt)}
                      </p>
                      {booking.notes ? (
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <NotebookText className="h-4 w-4" />
                          {booking.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      {booking.status === "APPROVED" ? (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmada
                        </span>
                      ) : null}
                      {canCancelBooking(booking) ? (
                        <Button variant="outline" onClick={() => void cancelBooking(booking.id)}>
                          <XCircle className="h-4 w-4" />
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderCourts() {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => (
          <Card key={court.id}>
            <CardHeader>
              <CardTitle>{court.name}</CardTitle>
              <CardDescription>{court.location || "Local nao informado"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
                <span className="text-muted-foreground">Modalidade</span>
                <strong>{formatCourtType(court.sportType)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
                <span className="text-muted-foreground">Status</span>
                <strong>{court.isActive ? "Disponivel" : "Indisponivel"}</strong>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Volleyball className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ola, {user.name}</p>
              <h1 className="text-2xl font-semibold">Quadra Facil</h1>
            </div>
          </div>

          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="min-w-0">
          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-100 p-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <div className="space-y-8">
            <section>
              {renderSchedule()}
            </section>

            <Separator />

            <section>
              {renderHistory()}
            </section>

            <Separator />

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Quadras</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulte os espacos disponiveis para suas proximas solicitacoes.
                </p>
              </div>
              {renderCourts()}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
