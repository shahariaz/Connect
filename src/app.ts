import express, { Express } from "express";
import { ConnectServer } from "./setupServer";
import connectDB from "./setupDatabase";
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
    connectDB();
    const app: Express = express();
    const server: ConnectServer = new ConnectServer(app);
    server.start();
  }
}

// Making sure the application is initialized only once
const application = Application.getInstance();
application.initialize();
