import type { Request, Response } from "express";

import {
  createCourt,
  deactivateCourt,
  getCourtById,
  listAllCourts,
  listCourts,
  updateCourt,
} from "./services/court.service";
import { AppError } from "../../shared/errors/AppError";

function getRouteParamId(request: Request): string {
  const { id } = request.params;

  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError("id route parameter is required");
  }

  return id;
}

export async function listCourtsController(_request: Request, response: Response): Promise<Response> {
  const courts = await listCourts();

  return response.status(200).json({
    courts,
  });
}

export async function listAllCourtsController(
  _request: Request,
  response: Response,
): Promise<Response> {
  const courts = await listAllCourts();

  return response.status(200).json({
    courts,
  });
}

export async function getCourtByIdController(
  request: Request,
  response: Response,
): Promise<Response> {
  const court = await getCourtById(getRouteParamId(request));

  return response.status(200).json({
    court,
  });
}

export async function createCourtController(
  request: Request,
  response: Response,
): Promise<Response> {
  const court = await createCourt(request.body);

  return response.status(201).json({
    court,
  });
}

export async function updateCourtController(
  request: Request,
  response: Response,
): Promise<Response> {
  const court = await updateCourt(getRouteParamId(request), request.body);

  return response.status(200).json({
    court,
  });
}

export async function deactivateCourtController(
  request: Request,
  response: Response,
): Promise<Response> {
  const court = await deactivateCourt(getRouteParamId(request));

  return response.status(200).json({
    court,
  });
}
