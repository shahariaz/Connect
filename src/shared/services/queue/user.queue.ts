import { userWorker } from "@worker/:user.worker";
import { BaseQueue } from "./base.queue";

import { IUserJob } from "@user/interfaces/user.interface";

class AuthQueue extends BaseQueue {
  constructor() {
    super("UserQueue");
    this.processJob("addUserJob", 5, userWorker.addUserToDB);
  }
  public addUserJob(name: string, data: IUserJob) {
    this.addJob(name, data);
  }
}

export const userQueue: AuthQueue = new AuthQueue();
