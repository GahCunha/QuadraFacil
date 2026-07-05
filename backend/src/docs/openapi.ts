export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Quadra Facil API",
    version: "0.1.0",
    description: "API para gerenciamento de reservas de quadras esportivas.",
  },
  servers: [
    {
      url: "http://localhost:3333",
      description: "Servidor local",
    },
  ],
  tags: [
    {
      name: "Health",
    },
    {
      name: "Auth",
    },
    {
      name: "Courts",
    },
    {
      name: "Bookings",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          email: {
            type: "string",
            format: "email",
          },
          role: {
            type: "string",
            enum: ["USER", "ADMIN"],
          },
          isActive: {
            type: "boolean",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
        },
      },
      Court: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          description: {
            type: "string",
            nullable: true,
          },
          sportType: {
            type: "string",
            enum: ["FUTSAL", "SOCIETY", "VOLEI", "BASQUETE", "TENIS", "BEACH_TENNIS", "PETECA"],
          },
          location: {
            type: "string",
            nullable: true,
          },
          openingMinutes: {
            type: "integer",
            example: 480,
          },
          closingMinutes: {
            type: "integer",
            example: 1320,
          },
          isActive: {
            type: "boolean",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      CourtInput: {
        type: "object",
        required: ["name", "sportType", "openingMinutes", "closingMinutes"],
        properties: {
          name: {
            type: "string",
            example: "Quadra Tenis",
          },
          description: {
            type: "string",
            nullable: true,
            example: "Quadra criada pelo Swagger",
          },
          sportType: {
            type: "string",
            enum: ["FUTSAL", "SOCIETY", "VOLEI", "BASQUETE", "TENIS", "BEACH_TENNIS", "PETECA"],
            example: "TENIS",
          },
          location: {
            type: "string",
            nullable: true,
            example: "Bloco B",
          },
          openingMinutes: {
            type: "integer",
            example: 480,
          },
          closingMinutes: {
            type: "integer",
            example: 1320,
          },
          isActive: {
            type: "boolean",
            example: true,
          },
        },
      },
      CourtUpdateInput: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          description: {
            type: "string",
            nullable: true,
          },
          sportType: {
            type: "string",
            enum: ["FUTSAL", "SOCIETY", "VOLEI", "BASQUETE", "TENIS", "BEACH_TENNIS", "PETECA"],
          },
          location: {
            type: "string",
            nullable: true,
            example: "Bloco B Atualizado",
          },
          openingMinutes: {
            type: "integer",
          },
          closingMinutes: {
            type: "integer",
            example: 1260,
          },
          isActive: {
            type: "boolean",
          },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          userId: {
            type: "string",
          },
          courtId: {
            type: "string",
          },
          startsAt: {
            type: "string",
            format: "date-time",
          },
          endsAt: {
            type: "string",
            format: "date-time",
          },
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
          },
          notes: {
            type: "string",
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      BookingInput: {
        type: "object",
        required: ["courtId", "startsAt", "endsAt"],
        properties: {
          courtId: {
            type: "string",
          },
          startsAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-06T09:00:00.000Z",
          },
          endsAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-06T10:00:00.000Z",
          },
          notes: {
            type: "string",
            nullable: true,
            example: "Treino",
          },
        },
      },
      BookingStatusInput: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
            example: "APPROVED",
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verifica se a API esta online",
        responses: {
          "200": {
            description: "API online",
          },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Cadastra um usuario comum",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    example: "Usuario Teste",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "usuario@quadrafacil.com",
                  },
                  password: {
                    type: "string",
                    example: "123456",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario cadastrado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "400": {
            description: "Dados invalidos",
          },
          "409": {
            description: "Email ja utilizado",
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Autentica um usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "admin@quadrafacil.com",
                  },
                  password: {
                    type: "string",
                    example: "admin123",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "401": {
            description: "Credenciais invalidas",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Retorna o usuario autenticado",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Usuario autenticado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Token ausente ou invalido",
          },
        },
      },
    },
    "/courts": {
      get: {
        tags: ["Courts"],
        summary: "Lista quadras ativas",
        responses: {
          "200": {
            description: "Lista de quadras",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courts: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Court",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Courts"],
        summary: "Cria uma quadra",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CourtInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Quadra criada",
          },
          "401": {
            description: "Token ausente ou invalido",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
        },
      },
    },
    "/courts/admin": {
      get: {
        tags: ["Courts"],
        summary: "Lista todas as quadras para administradores",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Lista de todas as quadras",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
        },
      },
    },
    "/courts/{id}": {
      get: {
        tags: ["Courts"],
        summary: "Busca uma quadra ativa por ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Quadra encontrada",
          },
          "404": {
            description: "Quadra nao encontrada",
          },
        },
      },
      put: {
        tags: ["Courts"],
        summary: "Atualiza uma quadra",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CourtUpdateInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Quadra atualizada",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
          "404": {
            description: "Quadra nao encontrada",
          },
        },
      },
      delete: {
        tags: ["Courts"],
        summary: "Desativa uma quadra",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Quadra desativada",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
          "404": {
            description: "Quadra nao encontrada",
          },
        },
      },
    },
    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "Lista todas as reservas para administradores",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Lista de reservas",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Cria uma reserva",
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BookingInput",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Reserva criada com status PENDING",
          },
          "400": {
            description: "Dados invalidos ou reserva fora do horario de funcionamento",
          },
          "409": {
            description: "Conflito de horario ou limite semanal atingido",
          },
        },
      },
    },
    "/bookings/me": {
      get: {
        tags: ["Bookings"],
        summary: "Lista minhas reservas",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Lista de reservas do usuario autenticado",
          },
        },
      },
    },
    "/bookings/{id}/status": {
      patch: {
        tags: ["Bookings"],
        summary: "Atualiza o status de uma reserva",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BookingStatusInput",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status atualizado",
          },
          "403": {
            description: "Acesso restrito a administradores",
          },
          "404": {
            description: "Reserva nao encontrada",
          },
        },
      },
    },
    "/bookings/{id}/cancel": {
      patch: {
        tags: ["Bookings"],
        summary: "Cancela uma reserva do usuario autenticado",
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Reserva cancelada",
          },
          "404": {
            description: "Reserva nao encontrada",
          },
        },
      },
    },
  },
} as const;
