import { Router } from "express";

import { authMiddleware } from "../../../middlewares/auth.middleware";
import { asyncHandler } from "../../../shared/http/asyncHandler";
import { loginController, meController, registerController } from "../auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(registerController));
authRoutes.post("/login", asyncHandler(loginController));
authRoutes.get("/me", authMiddleware, asyncHandler(meController));
