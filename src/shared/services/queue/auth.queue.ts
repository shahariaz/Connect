import { IAuthJob } from "@auth/interfaces/auth.interface";
import { BaseQueue } from "./base.queue";
import { authWorker } from "@worker/:auth.worker";

class AuthQueue extends BaseQueue {
  constructor() {
    super("AuthQueue");
    this.processJob("addAuthUserJob", 5, authWorker.addAuthUserToDB);
  }
  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
}
export const authQueue: AuthQueue = new AuthQueue();
