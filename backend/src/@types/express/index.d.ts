import type { AuthenticatedUser } from "../../shared/types/authenticatedUser";

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser;
    }
  }
}
