import { Role } from "@prisma/client";
import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/role.middleware";
import { asyncHandler } from "../../../shared/http/asyncHandler";
import {
  cancelBookingController,
  createBookingController,
  listAllBookingsController,
  listMyBookingsController,
  updateBookingStatusController,
} from "../booking.controller";

export const bookingRoutes = Router();

const adminOnly = [authMiddleware, requireRole(Role.ADMIN)];

bookingRoutes.post("/", authMiddleware, asyncHandler(createBookingController));
bookingRoutes.get("/me", authMiddleware, asyncHandler(listMyBookingsController));
bookingRoutes.get("/", adminOnly, asyncHandler(listAllBookingsController));
bookingRoutes.patch("/:id/status", adminOnly, asyncHandler(updateBookingStatusController));
bookingRoutes.patch("/:id/cancel", authMiddleware, asyncHandler(cancelBookingController));
