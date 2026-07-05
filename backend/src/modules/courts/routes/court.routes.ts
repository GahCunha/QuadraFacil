import { Role } from "@prisma/client";
import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/role.middleware";
import { asyncHandler } from "../../../shared/http/asyncHandler";
import {
  createCourtController,
  deactivateCourtController,
  getCourtAvailabilityController,
  getCourtByIdController,
  listAllCourtsController,
  listCourtsController,
  updateCourtController,
} from "../court.controller";

export const courtRoutes = Router();

const adminOnly = [authMiddleware, requireRole(Role.ADMIN)];

courtRoutes.get("/", asyncHandler(listCourtsController));
courtRoutes.get("/admin", adminOnly, asyncHandler(listAllCourtsController));
courtRoutes.get("/:id/availability", asyncHandler(getCourtAvailabilityController));
courtRoutes.get("/:id", asyncHandler(getCourtByIdController));
courtRoutes.post("/", adminOnly, asyncHandler(createCourtController));
courtRoutes.put("/:id", adminOnly, asyncHandler(updateCourtController));
courtRoutes.delete("/:id", adminOnly, asyncHandler(deactivateCourtController));
