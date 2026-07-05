import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import {
  createBlockedTime,
  deleteBlockedTime,
  listBlockedTimes,
  listBlockedTimesByCourt,
} from "./services/blocked-time.service";

function getRouteParam(request: Request, name: string): string {
  const value = request.params[name];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${name} route parameter is required`);
  }

  return value;
}

export async function createBlockedTimeController(
  request: Request,
  response: Response,
): Promise<Response> {
  const blockedTime = await createBlockedTime(request.body);

  return response.status(201).json({
    blockedTime,
  });
}

export async function listBlockedTimesController(
  _request: Request,
  response: Response,
): Promise<Response> {
  const blockedTimes = await listBlockedTimes();

  return response.status(200).json({
    blockedTimes,
  });
}

export async function listBlockedTimesByCourtController(
  request: Request,
  response: Response,
): Promise<Response> {
  const blockedTimes = await listBlockedTimesByCourt(getRouteParam(request, "courtId"));

  return response.status(200).json({
    blockedTimes,
  });
}

export async function deleteBlockedTimeController(
  request: Request,
  response: Response,
): Promise<Response> {
  const blockedTime = await deleteBlockedTime(getRouteParam(request, "id"));

  return response.status(200).json({
    blockedTime,
  });
}
