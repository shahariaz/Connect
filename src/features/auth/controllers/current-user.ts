import { userService } from "@service/db/user.service";
import { userCache } from "@service/redis/user.cache";
import { IUserDocument } from "@user/interfaces/user.interface";
import { Request, Response } from "express";

export class CurrentUser {
  public async read(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(
      `${req.currentUser?.userId}`
    )) as IUserDocument;
    const existingUser = cachedUser
      ? cachedUser
      : ((await userService.getUserById(
          `${req.currentUser?.userId}`
        )) as IUserDocument);
    if (Object.keys(existingUser).length) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }
    res.status(200).json({ isUser, token, user });
  }
}
