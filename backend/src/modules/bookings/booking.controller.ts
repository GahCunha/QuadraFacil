import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import {
  cancelBooking,
  createBooking,
  listAllBookings,
  listMyBookings,
  updateBookingStatus,
} from "./services/booking.service";

function getAuthenticatedUserId(request: Request): string {
  if (!request.user) {
    throw new AppError("unauthenticated", 401);
  }

  return request.user.id;
}

function getRouteParamId(request: Request): string {
  const { id } = request.params;

  if (typeof id !== "string" || id.trim().length === 0) {
    throw new AppError("id route parameter is required");
  }

  return id;
}

export async function createBookingController(
  request: Request,
  response: Response,
): Promise<Response> {
  const booking = await createBooking(getAuthenticatedUserId(request), request.body);

  return response.status(201).json({
    booking,
  });
}

export async function listMyBookingsController(
  request: Request,
  response: Response,
): Promise<Response> {
  const bookings = await listMyBookings(getAuthenticatedUserId(request));

  return response.status(200).json({
    bookings,
  });
}

export async function listAllBookingsController(
  _request: Request,
  response: Response,
): Promise<Response> {
  const bookings = await listAllBookings();

  return response.status(200).json({
    bookings,
  });
}

export async function updateBookingStatusController(
  request: Request,
  response: Response,
): Promise<Response> {
  const booking = await updateBookingStatus(getRouteParamId(request), request.body);

  return response.status(200).json({
    booking,
  });
}

export async function cancelBookingController(
  request: Request,
  response: Response,
): Promise<Response> {
  const booking = await cancelBooking(getRouteParamId(request), getAuthenticatedUserId(request));

  return response.status(200).json({
    booking,
  });
}
