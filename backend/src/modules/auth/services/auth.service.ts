import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Role, type User } from "@prisma/client";

import { prisma } from "../../../database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import type { AuthResponse, AuthUserResponse, LoginInput, RegisterInput } from "../dtos/auth.dtos";

const PASSWORD_MIN_LENGTH = 6;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return secret;
}

function getJwtExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required`);
  }

  return value.trim();
}

function validateEmail(email: string): void {
  if (!email.includes("@")) {
    throw new AppError("email must be valid");
  }
}

function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(`password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
}

function toUserResponse(user: User): AuthUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

function createToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: getJwtExpiresIn(),
    },
  );
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const name = validateRequiredString(input.name, "name");
  const email = normalizeEmail(validateRequiredString(input.email, "email"));
  const password = validateRequiredString(input.password, "password");

  validateEmail(email);
  validatePassword(password);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError("email is already in use", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.USER,
      isActive: true,
    },
  });

  return {
    token: createToken(user),
    user: toUserResponse(user),
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const email = normalizeEmail(validateRequiredString(input.email, "email"));
  const password = validateRequiredString(input.password, "password");

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("invalid credentials", 401);
  }

  if (!user.isActive) {
    throw new AppError("user is inactive", 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("invalid credentials", 401);
  }

  return {
    token: createToken(user),
    user: toUserResponse(user),
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUserResponse> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("user not found", 404);
  }

  if (!user.isActive) {
    throw new AppError("user is inactive", 403);
  }

  return toUserResponse(user);
}
