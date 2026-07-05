# Decisoes Tecnicas

## Frontend com React e Vite

Decisao: usar React com Vite no frontend, em vez de Next.js.

Motivos:

- O escopo atual e uma aplicacao web operacional.
- Nao ha necessidade imediata de SSR.
- Vite simplifica o desenvolvimento local.
- A API Express concentra as regras de negocio.

Impactos:

- O frontend fica em `frontend/`.
- O desenvolvimento local usa proxy do Vite com prefixo `/api`.
- Em deploy separado, sera necessario configurar CORS no backend ou servir frontend e backend sob o mesmo dominio.

## Componentes de interface

Decisao: usar shadcn/ui como base de componentes.

Motivos:

- Componentes reutilizaveis e customizaveis.
- Boa compatibilidade com Tailwind CSS.
- Reduz implementacao manual de componentes comuns como calendario, cards, campos e separadores.
