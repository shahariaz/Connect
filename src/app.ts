import express, { Express } from "express";
import { ConnectServer } from "./setupServer";
import connectDB from "./setupDatabase";
import { config } from "@root/config";
class Application {
  private static instance: Application;

  private constructor() {}

  public static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  public initialize(): void {
    this.loadConfig();
    connectDB();
    const app: Express = express();
    const server: ConnectServer = new ConnectServer(app);
    server.start();
  }
  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

// Making sure the application is initialized only once
const application = Application.getInstance();
application.initialize();
