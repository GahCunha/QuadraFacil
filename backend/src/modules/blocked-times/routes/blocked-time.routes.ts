import { Role } from "@prisma/client";
import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { requireRole } from "../../../middlewares/role.middleware";
import { asyncHandler } from "../../../shared/http/asyncHandler";
import {
  createBlockedTimeController,
  deleteBlockedTimeController,
  listBlockedTimesByCourtController,
  listBlockedTimesController,
} from "../blocked-time.controller";

export const blockedTimeRoutes = Router();

const adminOnly = [authMiddleware, requireRole(Role.ADMIN)];

blockedTimeRoutes.post("/", adminOnly, asyncHandler(createBlockedTimeController));
blockedTimeRoutes.get("/", adminOnly, asyncHandler(listBlockedTimesController));
blockedTimeRoutes.get("/court/:courtId", adminOnly, asyncHandler(listBlockedTimesByCourtController));
blockedTimeRoutes.delete("/:id", adminOnly, asyncHandler(deleteBlockedTimeController));
