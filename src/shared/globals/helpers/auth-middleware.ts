import { Request, Response, NextFunction } from "express";
import { config } from "@root/config";
import JWT from "jsonwebtoken";
import { NotAuthorizedError } from "./error-handler";
import { AuthPayload } from "@auth/interfaces/auth.interface";

export class AuthMiddleware {
  public verifyUser = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError("Token is not available. Please login.");
    }
    try {
      const payload: AuthPayload = JWT.verify(
        req.session?.jwt,
        config.JWT_TOKEN!
      ) as unknown as AuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError("Token is invalied.");
    }
    next();
  };
  public checkAuthenticated(
    req: Request,
    _res: Response,
    next: NextFunction
  ): void {
    if (!req.currentUser) {
      throw new NotAuthorizedError("You are not authenticated.");
    }
    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
