import { emailWorker } from "@worker/:email.worker";
import { BaseQueue } from "./base.queue";

class EmailQueue extends BaseQueue {
  constructor(queueName: string) {
    super(queueName);
    this.processJob("forgetPasswordEmail", 5, emailWorker.addNotificationEmail);
  }
  public addEmailJob(name: string, data: any): void {
    this.addJob(name, data);
  }
}

export const emailQueue: EmailQueue = new EmailQueue("email");
