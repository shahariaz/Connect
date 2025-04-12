import { IUserDocument } from "@user/interfaces/user.interface";
import { BaseCache } from "./base.cache";
import Logger from "bunyan";
import { config } from "@root/config";
import { ServerError } from "@global/helpers/error-handler";

const log: Logger = config.createLogger("UserCache");

export class UserCache extends BaseCache {
  constructor() {
    super("UserCache");
  }

  public async saveUserToCache(
    key: string,
    userId: string,
    createdUser: IUserDocument
  ): Promise<void> {
    const createdAt = new Date();

    const dataToSave: Record<string, string> = {
      _id: String(createdUser._id),
      uId: String(createdUser.uId),
      username: createdUser.username || "",
      email: createdUser.email || "",
      avatarColor: createdUser.avatarColor || "",
      createdAt: createdAt.toISOString(),
      postsCount: String(createdUser.postsCount),
      blocked: JSON.stringify(createdUser.blocked),
      blockedBy: JSON.stringify(createdUser.blockedBy),
      profilePicture: createdUser.profilePicture,
      followersCount: String(createdUser.followersCount),
      followingCount: String(createdUser.followingCount),
      notifications: JSON.stringify(createdUser.notifications),
      social: JSON.stringify(createdUser.social),
      work: createdUser.work || "",
      location: createdUser.location || "",
      school: createdUser.school || "",
      quote: createdUser.quote || "",
      bgImageVersion: createdUser.bgImageVersion || "",
      bgImageId: createdUser.bgImageId || "",
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        log.info("Redis client connected");
      }

      const pipeline = this.client.multi();
      pipeline.zAdd("user", {
        score: parseInt(userId, 10),
        value: key,
      });

      const userKey = `user:${key}`;
      pipeline.hSet(userKey, dataToSave);

      await pipeline.exec();
      log.info(`User data cached successfully for userId: ${userId}`);
    } catch (error) {
      log.error({ err: error, userId, key }, "Error saving user to cache");
      throw new ServerError("Internal server error. Please try again later.");
    }
  }
}
