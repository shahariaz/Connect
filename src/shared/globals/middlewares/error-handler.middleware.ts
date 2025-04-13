import { Request, Response, NextFunction } from "express";
import HTTP_STATUS from "http-status-codes";
import {
  CustomError,
  JoiRequestValidationError,
} from "@global/helpers/error-handler";
import Logger from "bunyan";
import { config } from "@root/config";

const log: Logger = config.createLogger("errorHandler");

export class ErrorHandlerMiddleware {
  public static catchErrors(fn: Function) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  public static handleErrors(
    error: any,
    _req: Request,
    res: Response,
    next: NextFunction
  ): void {
    log.error("Error:", error);

    if (error instanceof JoiRequestValidationError) {
      res
        .status(error.statusCode)
        .json({ message: error.message, status: error.status });
      return;
    }

    if (error instanceof CustomError) {
      res.status(error.statusCode).json(error.serializeErrors());
      return;
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
