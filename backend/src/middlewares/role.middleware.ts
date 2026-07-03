import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

import { AppError } from "../shared/errors/AppError";

export function requireRole(...roles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      throw new AppError("unauthenticated", 401);
    }

    if (!roles.includes(request.user.role)) {
      throw new AppError("forbidden", 403);
    }

    next();
  };
}
