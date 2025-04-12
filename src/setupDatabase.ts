import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private retryCount: number = 0;
  private isConnected: boolean = false;

  private constructor() {
    mongoose.set("strictQuery", false);

    mongoose.connection.on("connected", () => {
      console.log("✅ Database connected");
      this.isConnected = true;
    });

    mongoose.connection.on("error", (err) => {
      console.log(`❌ Database connection error: ${err}`);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Database disconnected");
      this.isConnected = false;
      this.handleDisconnection();
    });

    process.on("SIGINT", this.handleAppTermination.bind(this));
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (!process.env.DEFAULT_DATABASE_URL) {
        throw new Error(
          "DEFAULT_DATABASE_URL is required in environment variables"
        );
      }

      const connectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }

      await mongoose.connect(
        process.env.DEFAULT_DATABASE_URL,
        connectionOptions
      );
      this.retryCount = 0;
    } catch (error) {
      console.log(`🚫 Error connecting to database: ${error}`);
      await this.handleConnectionError();
    }
  }

  private async handleConnectionError(): Promise<void> {
    if (this.retryCount >= MAX_RETRIES) {
      console.log(
        `❌ Max retries of ${MAX_RETRIES} exceeded. Exiting process.`
      );
      process.exit(1);
    } else {
      this.retryCount++;
      console.log(
        `🔁 Retrying connection. Attempt ${this.retryCount} of ${MAX_RETRIES}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      await this.connect();
    }
  }

  private async handleDisconnection(): Promise<void> {
    if (!this.isConnected) {
      console.log("🔄 Attempting to reconnect to the database...");
      await this.connect();
    }
  }

  private async handleAppTermination(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log("🛑 Database connection closed due to app termination");
      process.exit(0);
    } catch (error) {
      console.log(`❌ Error closing DB connection on exit: ${error}`);
      process.exit(1);
    }
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }
}

// Singleton instance
const db = DatabaseConnection.getInstance();

// Exports
export default db.connect.bind(db);
export const getDBStatus = db.getConnectionStatus.bind(db);
