import { config } from "@root/config";
import { authService } from "@service/db/auth.service";
import { DoneCallback, Job } from "bull";
import Logger from "bunyan";

const log: Logger = config.createLogger("AuthWorker");
class AuthWorker {
  async addAuthUserToDB(job: Job, done: DoneCallback) {
    try {
      const { value } = job.data;
      await authService.createAuthUser(value);
      job.progress(100);
      done(null, value);
    } catch (error) {
      log.error("Error in addAuthUserToDB worker", error);
      done(error as Error);
    }
  }
}
export const authWorker: AuthWorker = new AuthWorker();
