import { beforeEach, describe, expect, it, vi } from "vitest";
import { Role, type User } from "@prisma/client";

import { AppError } from "../../../../shared/errors/AppError";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

const jwtMock = vi.hoisted(() => ({
  sign: vi.fn(),
}));

vi.mock("../../../../database/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("bcrypt", () => ({
  default: bcryptMock,
}));

vi.mock("jsonwebtoken", () => ({
  default: jwtMock,
}));

import { getCurrentUser, login, register } from "../auth.service";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-id",
    name: "Usuario Teste",
    email: "user@quadrafacil.com",
    passwordHash: "hashed-password",
    role: Role.USER,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRES_IN = "1d";
    bcryptMock.hash.mockResolvedValue("hashed-password");
    bcryptMock.compare.mockResolvedValue(true);
    jwtMock.sign.mockReturnValue("signed-token");
  });

  describe("register", () => {
    it("creates an active user and returns a token without passwordHash", async () => {
      const createdUser = makeUser({
        email: "novo@quadrafacil.com",
      });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await register({
        name: " Novo Usuario ",
        email: " NOVO@QuadraFacil.com ",
        password: "123456",
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "novo@quadrafacil.com",
        },
      });
      expect(bcryptMock.hash).toHaveBeenCalledWith("123456", 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: "Novo Usuario",
          email: "novo@quadrafacil.com",
          passwordHash: "hashed-password",
          role: Role.USER,
          isActive: true,
        },
      });
      expect(result).toEqual({
        token: "signed-token",
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          isActive: true,
        },
      });
      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("rejects duplicate emails", async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());

      await expect(
        register({
          name: "Usuario Teste",
          email: "user@quadrafacil.com",
          password: "123456",
        }),
      ).rejects.toMatchObject({
        message: "email is already in use",
        statusCode: 409,
      });
    });

    it("rejects short passwords", async () => {
      await expect(
        register({
          name: "Usuario Teste",
          email: "user@quadrafacil.com",
          password: "123",
        }),
      ).rejects.toMatchObject({
        message: "password must be at least 6 characters",
        statusCode: 400,
      });
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("rejects invalid email", async () => {
      await expect(
        register({
          name: "Usuario Teste",
          email: "email-invalido",
          password: "123456",
        }),
      ).rejects.toMatchObject({
        message: "email must be valid",
        statusCode: 400,
      });
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns a token for valid active user credentials", async () => {
      const user = makeUser({
        role: Role.ADMIN,
      });

      prismaMock.user.findUnique.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true);

      const result = await login({
        email: " USER@QuadraFacil.com ",
        password: "admin123",
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "user@quadrafacil.com",
        },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith("admin123", user.passwordHash);
      expect(result.token).toBe("signed-token");
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
        role: Role.ADMIN,
      });
      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("rejects unknown users", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        login({
          email: "missing@quadrafacil.com",
          password: "123456",
        }),
      ).rejects.toMatchObject({
        message: "invalid credentials",
        statusCode: 401,
      });
    });

    it("rejects inactive users", async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        makeUser({
          isActive: false,
        }),
      );

      await expect(
        login({
          email: "user@quadrafacil.com",
          password: "123456",
        }),
      ).rejects.toMatchObject({
        message: "user is inactive",
        statusCode: 403,
      });
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it("rejects invalid password", async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser());
      bcryptMock.compare.mockResolvedValue(false);

      await expect(
        login({
          email: "user@quadrafacil.com",
          password: "wrong-password",
        }),
      ).rejects.toMatchObject({
        message: "invalid credentials",
        statusCode: 401,
      });
    });
  });

  describe("getCurrentUser", () => {
    it("returns active user without passwordHash", async () => {
      const user = makeUser();

      prismaMock.user.findUnique.mockResolvedValue(user);

      const result = await getCurrentUser(user.id);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: user.id,
        },
      });
      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
      });
      expect(result).not.toHaveProperty("passwordHash");
    });

    it("rejects missing users", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(getCurrentUser("missing-id")).rejects.toMatchObject({
        message: "user not found",
        statusCode: 404,
      });
    });

    it("rejects inactive users", async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        makeUser({
          isActive: false,
        }),
      );

      await expect(getCurrentUser("inactive-id")).rejects.toMatchObject({
        message: "user is inactive",
        statusCode: 403,
      });
    });
  });

  it("fails with a server error when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    bcryptMock.compare.mockResolvedValue(true);

    await expect(
      login({
        email: "user@quadrafacil.com",
        password: "123456",
      }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      login({
        email: "user@quadrafacil.com",
        password: "123456",
      }),
    ).rejects.toMatchObject({
      message: "JWT_SECRET is not configured",
      statusCode: 500,
    });
  });
});
