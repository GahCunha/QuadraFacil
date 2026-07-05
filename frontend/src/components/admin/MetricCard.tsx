import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
};

export function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
  return (
    <article className="rounded-md border border-border bg-background p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <strong className="mt-2 block text-3xl font-semibold">{value}</strong>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </article>
  );
}
