# Quadra Fácil V2

Sistema profissional para gerenciamento de reservas de quadras esportivas.

## Estrutura

```text
QuadraFacil/
├── .agents/
│   └── agents/
├── docs/
├── backend/
├── frontend/
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

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Documentação

- `docs/AI_CONTEXT.md`: contexto geral para agentes e desenvolvimento.
- `docs/ROADMAP.md`: fases planejadas.
- `docs/DATABASE.md`: modelagem de dados.
- `docs/API.md`: contratos de API.
- `docs/DECISIONS.md`: decisões técnicas.

## Regras principais

- Usuários comuns fazem reservas.
- Administradores gerenciam quadras.
- Reservas não podem ocorrer no passado.
- Não pode haver conflito entre reservas.
- Reservas devem respeitar horário de funcionamento.
- Cada usuário pode ter no máximo três reservas por semana.
- Status de reserva: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
