import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import cookieSession from "cookie-session";
import HTTP_STATUS from "http-status-codes";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import Logger from "bunyan";
import "express-async-errors";
import { config } from "@root/config";
import applicationRoutes from "@root/routes";
import { CustomError, IErrorResponse } from "@global/helpers/error-handler";

const SERVER_PORT = 8080;
const log: Logger = config.createLogger("server");

export class ConnectServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.apiMonitoring(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.set("trust proxy", 1);
    app.use(
      cookieSession({
        name: "session",
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
        secure: config.NODE_ENV !== "development",
        sameSite: "none", // comment this line when running the server locally
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: "50mb" }));
    app.use(urlencoded({ extended: true, limit: "50mb" }));
  }

  private routesMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private apiMonitoring(app: Application): void {}

  private globalErrorHandler(app: Application): void {
    // Catch-all for unmatched routes (404)
    app.all("*", (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: `${req.originalUrl} not found`,
        status: HTTP_STATUS.NOT_FOUND,
      });
    });

    // Global Error Handler
    // Global Error Handler
    const errorHandler: ErrorRequestHandler = (
      error: IErrorResponse,
      _req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      log.error(`[Global Error Handler]`, error);

      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      } else {
        // Fallback for unexpected errors
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          message: "Something went wrong",
          error: error.message || "Unknown error",
        });
      }

      // Optionally call next if needed (not usually for final error handler)
      // next();
    };

    app.use(errorHandler);
  }

  private async startServer(app: Application): Promise<void> {
    if (!config.JWT_TOKEN) {
      throw new Error("JWT_TOKEN must be provided");
    }
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    });
    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Worker with process id of ${process.pid} has started...`);
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {}
}
