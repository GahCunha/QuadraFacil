# Frontend - Quadra Facil

O frontend do Quadra Facil V2 usa React com Vite.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react

## Desenvolvimento local

Instale as dependencias:

```powershell
cd frontend
npm install
```

Copie as variaveis de ambiente:

```powershell
Copy-Item .env.example .env
```

Rode o frontend:

```powershell
npm run dev
```

A aplicacao fica em:

```text
http://localhost:5173
```

## Integracao local

Durante o desenvolvimento, o frontend usa o proxy do Vite:

```text
/api -> http://localhost:3333
```

Variaveis:

- `VITE_API_BASE_URL`: base usada pelo frontend para chamadas HTTP. Padrao: `/api`.
- `VITE_API_PROXY_TARGET`: destino do proxy local. Padrao: `http://localhost:3333`.

## Areas da aplicacao

- Login e cadastro de usuarios comuns.
- Painel administrativo para usuarios `ADMIN`.
- Area do usuario comum para solicitar agendamentos, acompanhar proximas reservas e consultar historico.
