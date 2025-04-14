import { config } from "@root/config";
import { userService } from "@service/db/user.service";
import { Job, DoneCallback } from "bull";
import Logger from "bunyan";

class UserWorker {
  log: Logger = config.createLogger("UserWorker");
  async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { value } = job.data;
      await userService.createUser(value);
      job.progress(100);
      done(null, value);
    } catch (error) {
      this.log.error("Error in addUserToDB worker", error);
      done(error as Error);
    }
  }
}

export const userWorker: UserWorker = new UserWorker();
