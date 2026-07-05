import { Router } from "express";
import swaggerUi from "swagger-ui-express";

import { openApiDocument } from "./openapi";

export const swaggerRoutes = Router();

swaggerRoutes.get("/openapi.json", (_request, response) => {
  return response.status(200).json(openApiDocument);
});

swaggerRoutes.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
