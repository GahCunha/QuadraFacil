import { Loader2, LockKeyhole, ShieldCheck, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";

import { apiPost } from "@/api/http";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthResponse, UserSummary } from "@/types/api";

type LoginPageProps = {
  onAuthenticated: (session: { token: string; user: UserSummary }) => void;
};

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response =
        mode === "login"
          ? await apiPost<AuthResponse>("/auth/login", {
              email,
              password,
            })
          : await apiPost<AuthResponse>("/auth/register", {
              name,
              email,
              password,
            });

      onAuthenticated(response);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Erro ao acessar o sistema");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted text-foreground">
      <section className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden min-h-screen flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-foreground/15">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <strong className="block text-base font-semibold">Quadra Facil</strong>
              <span className="text-sm text-primary-foreground/70">Reservas escolares</span>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary-foreground/70">Quadras esportivas</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight">
              Solicite horarios e acompanhe suas reservas em um so lugar.
            </h1>
            <p className="mt-5 text-base leading-7 text-primary-foreground/75">
              Usuarios fazem solicitacoes de agendamento. Administradores acompanham e aprovam as
              reservas pelo painel de gestao.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-4">
              Solicitar horario
            </div>
            <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-4">
              Ver disponibilidade
            </div>
            <div className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-4">
              Historico
            </div>
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
          <Card className="w-full max-w-md border-border bg-background shadow-panel">
            <CardHeader>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl">
                {mode === "login" ? "Entrar no Quadra Facil" : "Criar conta"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Acesse com sua conta para continuar."
                  : "Crie uma conta de usuario para solicitar reservas."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button className="h-10 w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "login" ? (
                    <LockKeyhole />
                  ) : (
                    <UserPlus />
                  )}
                  {mode === "login" ? "Entrar" : "Criar conta"}
                </Button>

                <button
                  className="w-full text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode((current) => (current === "login" ? "register" : "login"));
                  }}
                >
                  {mode === "login" ? "Ainda nao tenho conta" : "Ja tenho conta"}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
