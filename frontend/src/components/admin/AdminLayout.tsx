import {
  CalendarClock,
  Clock3,
  Home,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Volleyball,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "./Button";

export type AdminPage = "dashboard" | "courts" | "bookings" | "blocked" | "users" | "settings";

type NavItem = {
  id: AdminPage;
  label: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Início", icon: Home },
  { id: "courts", label: "Quadras", icon: Volleyball },
  { id: "bookings", label: "Reservas", icon: CalendarClock },
  { id: "blocked", label: "Horários bloqueados", icon: Clock3 },
  { id: "users", label: "Usuários", icon: Users },
  { id: "settings", label: "Configurações", icon: Settings },
];

type AdminLayoutProps = {
  activePage: AdminPage;
  children: ReactNode;
  onNavigate: (page: AdminPage) => void;
  adminName: string;
  onLogout: () => void;
};

export function AdminLayout({
  activePage,
  children,
  onNavigate,
  adminName,
  onLogout,
}: AdminLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function navigate(page: AdminPage) {
    onNavigate(page);
    setIsMobileOpen(false);
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <strong className="block text-sm font-semibold">Quadra Fácil</strong>
            <span className="text-xs text-muted-foreground">Painel administrativo</span>
          </div>
        </div>
        <button
          className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
          type="button"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activePage;

          return (
            <button
              key={item.id}
              className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              type="button"
              onClick={() => navigate(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Administrador
        </p>
        <p className="mt-2 truncate text-sm font-medium">{adminName}</p>
        <Button className="mt-3 w-full" variant="secondary" onClick={onLogout}>
          Sair
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-muted text-foreground">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              className="h-10 w-10 px-0 lg:hidden"
              variant="secondary"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Administração</p>
              <h1 className="text-lg font-semibold">
                {navItems.find((item) => item.id === activePage)?.label}
              </h1>
            </div>
          </div>
          <span className="hidden rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            Ambiente local
          </span>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
