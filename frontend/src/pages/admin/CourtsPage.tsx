import { Edit3, Plus, Volleyball } from "lucide-react";

import { Button } from "../../components/admin/Button";
import { EmptyState } from "../../components/admin/EmptyState";
import { CourtStatusBadge } from "../../components/admin/StatusBadge";
import type { Court } from "../../types/api";
import { formatCourtType, formatMinutes } from "./admin-formatters";

type CourtsPageProps = {
  courts: Court[];
  isLoading: boolean;
};

export function CourtsPage({ courts, isLoading }: CourtsPageProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Quadras</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os espaços disponíveis para reservas.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Cadastrar nova quadra
        </Button>
      </section>

      {isLoading ? (
        <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
          Carregando quadras...
        </div>
      ) : courts.length === 0 ? (
        <EmptyState
          icon={Volleyball}
          title="Nenhuma quadra cadastrada"
          description="Cadastre a primeira quadra para iniciar o controle de disponibilidade."
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courts.map((court) => (
            <article key={court.id} className="rounded-md border border-border bg-background p-4 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{court.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {court.location || "Local não informado"}
                  </p>
                </div>
                <CourtStatusBadge isActive={court.isActive} />
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-muted p-3">
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Tipo</dt>
                  <dd className="mt-1 font-semibold">{formatCourtType(court.sportType)}</dd>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <dt className="text-xs font-medium uppercase text-muted-foreground">Preço/hora</dt>
                  <dd className="mt-1 font-semibold">A definir</dd>
                </div>
                <div className="col-span-2 rounded-md bg-muted p-3">
                  <dt className="text-xs font-medium uppercase text-muted-foreground">
                    Funcionamento
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatMinutes(court.openingMinutes)} - {formatMinutes(court.closingMinutes)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex justify-end">
                <Button variant="secondary">
                  <Edit3 className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
