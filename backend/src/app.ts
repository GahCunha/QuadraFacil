import express from "express";

import { errorMiddleware } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/auth/routes/auth.routes";
import { healthRoutes } from "./routes/health.routes";

export const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

app.use(errorMiddleware);
