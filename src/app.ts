import express, { Express } from "express";
import { ConnectServer } from "@root/setupServer";
import databaseConnection from "@root/setupDatabase";

import { config } from "@root/config";
import Logger from "bunyan";
import { redisConnection } from "@service/redis/redis.connection";

const log: Logger = config.createLogger("app");

class Application {
  public async initialize(): Promise<void> {
    this.loadConfig();

    databaseConnection();
    await redisConnection.connect();
    // 👈 Add this to init Redis

    const app: Express = express();
    const server: ConnectServer = new ConnectServer(app);
    server.start();
    Application.handleExit();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }

  private static handleExit(): void {
    process.on("uncaughtException", (error: Error) => {
      log.error(`There was an uncaught error: ${error}`);
      Application.shutDownProperly(1);
    });

    process.on("unhandledRejection", (reason: any) => {
      // fix typo: `unhandleRejection` ➜ `unhandledRejection`
      log.error(`Unhandled rejection at promise: ${reason}`);
      Application.shutDownProperly(2);
    });

    process.on("SIGTERM", () => {
      log.error("Caught SIGTERM");
      Application.shutDownProperly(2);
    });

    process.on("SIGINT", () => {
      log.error("Caught SIGINT");
      Application.shutDownProperly(2);
    });

    process.on("exit", () => {
      log.error("Exiting");
    });
  }

  private static shutDownProperly(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        log.info("Shutdown complete");
        process.exit(exitCode);
      })
      .catch((error) => {
        log.error(`Error during shutdown: ${error}`);
        process.exit(1);
      });
  }
}

const application: Application = new Application();
application.initialize(); // NOTE: Now async!
