import express from "express";

import { swaggerRoutes } from "./docs/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/auth/routes/auth.routes";
import { courtRoutes } from "./modules/courts/routes/court.routes";
import { healthRoutes } from "./routes/health.routes";

export const app = express();

app.use(express.json());

app.use(swaggerRoutes);
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/courts", courtRoutes);

app.use(errorMiddleware);
