# Banco de Dados - Quadra Facil

Este documento registra a modelagem inicial do banco de dados configurada com Prisma e MySQL.

## Configuracao

- ORM: Prisma
- Banco: MySQL
- Schema: `backend/prisma/schema.prisma`
- Configuracao Prisma: `backend/prisma.config.ts`
- Variavel de conexao: `DATABASE_URL`
- Exemplo local com Docker: `mysql://quadrafacil:quadrafacil@localhost:3306/quadrafacil`
- Adapter futuro para Prisma Client: `@prisma/adapter-mariadb`

## Docker

O projeto possui um `docker-compose.yml` na raiz com um servico MySQL para desenvolvimento local.

Comandos principais:

```powershell
docker compose up -d mysql
docker compose ps
docker compose logs mysql
docker compose down
```

O volume `quadrafacil_mysql_data` preserva os dados entre reinicios do container.

## Enums

### Role

Define o papel do usuario no sistema.

- `USER`: usuario comum que consulta quadras e solicita reservas.
- `ADMIN`: administrador que gerencia quadras, bloqueios e reservas.

### BookingStatus

Define o status de uma reserva.

- `PENDING`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

### SportType

Define o tipo de esporte da quadra.

- `FUTSAL`
- `SOCIETY`
- `VOLEI`
- `BASQUETE`
- `TENIS`
- `BEACH_TENNIS`
- `PETECA`

## Entidades iniciais

### User

Representa usuarios comuns e administradores.

Campos:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Relacionamentos:

- Um usuario pode ter varias reservas (`bookings`).

Regras:

- `email` deve ser unico.
- `role` usa o enum `Role`.
- `isActive` permite desativar usuarios sem exclusao fisica.
- Senhas devem ser armazenadas apenas em `passwordHash`.

### Court

Representa uma quadra esportiva.

Campos:

- `id`
- `name`
- `description`
- `sportType`
- `location`
- `openingMinutes`
- `closingMinutes`
- `isActive`
- `createdAt`
- `updatedAt`

Relacionamentos:

- Uma quadra pode ter varias reservas (`bookings`).
- Uma quadra pode ter varios bloqueios de horario (`blockedTimes`).

Regras:

- Apenas quadras ativas devem ficar disponiveis para novas reservas.
- `sportType` usa o enum `SportType`.
- `location` identifica onde a quadra fica, como `Quadra 1`, `Ginasio` ou `Bloco B`.
- `openingMinutes` e `closingMinutes` guardam o horario de funcionamento base em minutos desde 00:00.
- Exemplos: `08:00 = 480`, `09:30 = 570`, `22:00 = 1320`.

### Booking

Representa uma reserva de quadra.

Campos:

- `id`
- `userId`
- `courtId`
- `startsAt`
- `endsAt`
- `status`
- `notes`
- `createdAt`
- `updatedAt`

Relacionamentos:

- Uma reserva pertence a um usuario.
- Uma reserva pertence a uma quadra.

Regras:

- `status` usa o enum `BookingStatus`.
- `notes` armazena observacoes opcionais da reserva, como treino, aula pratica ou evento interno.
- O status inicial recomendado para novas reservas e `PENDING`.
- Reservas nao podem ocorrer no passado.
- Nao deve haver conflito entre reservas da mesma quadra.
- Deve respeitar o horario de funcionamento da quadra.
- Cada usuario pode ter no maximo tres reservas por semana.

Observacao:

- A documentacao anterior usava o nome `Reservation`. A modelagem da Sprint 2 usa `Booking`, conforme objetivo definido para esta sprint.

### BlockedTime

Representa um periodo em que uma quadra nao pode receber reservas, como manutencao, evento interno ou indisponibilidade administrativa.

Campos:

- `id`
- `courtId`
- `startsAt`
- `endsAt`
- `reason`
- `createdAt`
- `updatedAt`

Relacionamentos:

- Um bloqueio pertence a uma quadra.

Regras:

- Novas reservas nao devem conflitar com bloqueios de horario.
- A validacao de conflito com bloqueios sera implementada na camada de regras de negocio em sprint futura.

## Indices

Indices previstos no schema inicial:

- `Booking`: `userId + startsAt`
- `Booking`: `courtId + startsAt + endsAt`
- `Booking`: `courtId + status + startsAt`
- `BlockedTime`: `courtId + startsAt + endsAt`

## Pontos de atencao

- O MySQL nao possui uma restricao nativa simples para impedir sobreposicao de intervalos de horario.
- Conflitos de reservas e bloqueios devem ser validados em transacao na camada de servico.
- Todas as datas devem ser armazenadas em UTC.
- A aplicacao deve converter datas para `America/Sao_Paulo` na camada de apresentacao.
- A definicao de inicio da semana ainda precisa ser registrada antes da regra de limite semanal.
- Horarios de funcionamento por dia da semana podem exigir uma tabela propria no futuro.
- Nao adicionar ainda `RefreshToken`, `approvedById`, `createdById`, auditoria ou historico; esses itens ficam para sprints futuras.
