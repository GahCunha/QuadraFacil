import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { getCurrentUser, login, register } from "./services/auth.service";

export async function registerController(request: Request, response: Response): Promise<Response> {
  const result = await register(request.body);

  return response.status(201).json(result);
}

export async function loginController(request: Request, response: Response): Promise<Response> {
  const result = await login(request.body);

  return response.status(200).json(result);
}

export async function meController(request: Request, response: Response): Promise<Response> {
  if (!request.user) {
    throw new AppError("unauthenticated", 401);
  }

  const user = await getCurrentUser(request.user.id);

  return response.status(200).json({
    user,
  });
}
