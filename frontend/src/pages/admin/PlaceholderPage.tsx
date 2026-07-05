import type { LucideIcon } from "lucide-react";

import { EmptyState } from "../../components/admin/EmptyState";

type PlaceholderPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function PlaceholderPage({ icon, title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <EmptyState
        icon={icon}
        title="Backend ainda não disponível"
        description="A estrutura visual já está pronta para receber integração assim que o recurso correspondente for criado."
      />
    </div>
  );
}
