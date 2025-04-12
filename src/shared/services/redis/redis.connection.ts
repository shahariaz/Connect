import Logger from "bunyan";

import { BaseCache } from "./base.cache";
import { config } from "@root/config";

const log: Logger = config.createLogger("redisConnection");

class RedisConnection extends BaseCache {
  constructor() {
    super("RedisConnection");
  }
  async connect(): Promise<void> {
    try {
      await this.client.connect();

      log.info("Redis client connected successfully.");
    } catch (error) {
      log.error("Error connecting to Redis client:", error);
    }
  }
}
export const redisConnection: RedisConnection = new RedisConnection();
