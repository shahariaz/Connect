import { config } from "@root/config";
import { Job, DoneCallback } from "bull";
import Logger from "bunyan";

class UserWorker {
  log: Logger = config.createLogger("UserWorker");
  async addUserToDB(job: Job, done: DoneCallback) {
    try {
      const { value } = job.data;
      // Simulate a database operation
      job.progress(100);
      done(null, value);
    } catch (error) {
      this.log.error("Error in addUserToDB worker", error);
      done(error as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
