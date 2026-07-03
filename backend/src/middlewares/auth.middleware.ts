import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { AppError } from "../shared/errors/AppError";

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: Role;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return secret;
}

export function authMiddleware(request: Request, _response: Response, next: NextFunction): void {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    throw new AppError("authorization header is required", 401);
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("authorization header must use Bearer token", 401);
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    if (!decoded.sub || !decoded.email || !decoded.role) {
      throw new AppError("invalid token payload", 401);
    }

    request.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("invalid or expired token", 401);
  }
}
