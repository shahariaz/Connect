import Logger from "bunyan";
import { config } from "@root/config";
import { DoneCallback, Job } from "bull";
import { mailTransport } from "@service/emails/mail.transport";

const log: Logger = config.createLogger("EmailWorker");
class EmailWorker {
  async addNotificationEmail(job: Job, done: DoneCallback): Promise<void> {
    try {
      const { template, receiverEmail, subject } = job.data;
      await mailTransport.sendMial(receiverEmail, subject, template);
      log.info("Email sent successfully");
      done(null, job.data);
    } catch (error) {
      log.error(`Error sending email: ${error}`);
      done(error as Error);
    }
  }
}
export const emailWorker: EmailWorker = new EmailWorker();
