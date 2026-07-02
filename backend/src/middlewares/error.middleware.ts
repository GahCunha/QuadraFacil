import type { ErrorRequestHandler } from "express";

import { AppError } from "../shared/errors/AppError";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return response.status(500).json({
    message: "Internal server error",
  });
};
