import { Clock3, Plus } from "lucide-react";

import { Button } from "../../components/admin/Button";
import { EmptyState } from "../../components/admin/EmptyState";
import type { BlockedTime } from "../../types/api";
import { formatDate, formatTime } from "./admin-formatters";

type BlockedTimesPageProps = {
  blockedTimes: BlockedTime[];
  isLoading: boolean;
};

export function BlockedTimesPage({ blockedTimes, isLoading }: BlockedTimesPageProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Horários bloqueados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle períodos de manutenção, aulas internas e indisponibilidades.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Adicionar bloqueio
        </Button>
      </section>

      {isLoading ? (
        <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
          Carregando bloqueios...
        </div>
      ) : blockedTimes.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="Nenhum horário bloqueado"
          description="Bloqueios administrativos aparecerão aqui quando forem cadastrados."
        />
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {blockedTimes.map((blockedTime) => (
            <article
              key={blockedTime.id}
              className="rounded-md border border-border bg-background p-4 shadow-panel"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {blockedTime.court?.name || `Quadra ${blockedTime.courtId}`}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(blockedTime.startsAt)}
                  </p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  Bloqueado
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Horário</p>
                  <p className="mt-1 font-semibold">
                    {formatTime(blockedTime.startsAt)} - {formatTime(blockedTime.endsAt)}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Motivo</p>
                  <p className="mt-1 font-semibold">{blockedTime.reason || "Não informado"}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
