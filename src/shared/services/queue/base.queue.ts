import Queue, { Job } from "bull";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { config } from "@root/config";
import Logger from "bunyan";

let bullAdapter: BullAdapter[] = [];
export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
  queue: Queue.Queue;
  log: Logger;
  constructor(queueName: string) {
    this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
    bullAdapter.push(new BullAdapter(this.queue));
    bullAdapter = [...new Set(bullAdapter)];
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    createBullBoard({
      queues: bullAdapter,
      serverAdapter,
    });
    this.log = config.createLogger(`${queueName} Queue`);
    this.queue.on("completed", (job: Job) => {
      this.log.info(`Job ${job.id} completed!`);
      job.remove();
    });
    this.queue.on("global:completed", (jobId: string) => {
      this.log.info(`Job ${jobId} completed!`);
    });
    this.queue.on("stalled", (jobId: string) => {
      this.log.info(`Job ${jobId} stalled!`);
    });
  }
}
