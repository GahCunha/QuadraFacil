# Quadra Facil V2

Sistema profissional para gerenciamento de reservas de quadras esportivas.

## Estrutura

```text
QuadraFacil/
├── .agents/
├── docs/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Stack

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- MySQL
- JWT
- bcrypt

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react

## Desenvolvimento local

### Banco de dados com Docker

Suba o MySQL:

```powershell
docker compose up -d mysql
```

Verifique o status:

```powershell
docker compose ps
```

Veja os logs do banco:

```powershell
docker compose logs mysql
```

Pare os containers:

```powershell
docker compose down
```

### Backend

Copie as variaveis de ambiente:

```powershell
cd backend
Copy-Item .env.example .env
```

Instale dependencias:

```powershell
npm install
```

Valide o schema do Prisma:

```powershell
npm run prisma:validate
```

Gere o Prisma Client:

```powershell
npm run prisma:generate
```

Rode o seed inicial:

```powershell
npm run prisma:seed
```

Abra o Prisma Studio:

```powershell
npm run db:studio
```

Rode o backend:

```powershell
npm run dev
```

Endpoint de saude:

```text
GET http://localhost:3333/health
```

### Frontend

Instale dependencias:

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

Aplicacao:

```text
http://localhost:5173
```

Em desenvolvimento, o frontend usa proxy do Vite:

```text
/api -> http://localhost:3333
```

## Documentacao

- `docs/AI_CONTEXT.md`: contexto geral para agentes e desenvolvimento.
- `docs/ROADMAP.md`: fases planejadas.
- `docs/DATABASE.md`: modelagem de dados.
- `docs/API.md`: contratos de API.
- `docs/DECISIONS.md`: decisoes tecnicas.
- `docs/FRONTEND.md`: stack e instrucoes do frontend.

## Regras principais

- Usuarios comuns fazem reservas.
- Administradores gerenciam quadras.
- Reservas nao podem ocorrer no passado.
- Nao pode haver conflito entre reservas.
- Reservas devem respeitar horario de funcionamento.
- Cada usuario pode ter no maximo tres reservas por semana.
- Status de reserva: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

## Seed inicial

O seed cria dados basicos para desenvolvimento local:

- admin: `admin@quadrafacil.com`
- senha: `admin123`
- quadras iniciais para futsal, society e beach tennis
