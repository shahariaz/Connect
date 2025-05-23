import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { Helpers } from "@global/helpers/helpers";
import { IUserDocument } from "@user/interfaces/user.interface";
import { UserModel } from "@user/models/user.schema";
import mongoose from "mongoose";

class UserService {
  public async createUser(data: IAuthDocument): Promise<void> {
    await UserModel.create(data);
  }
  public async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<IUserDocument | null> {
    const query = {
      $or: [
        { username: Helpers.firstLetterUpperCase(username) },
        { email: Helpers.lowerCase(email) },
      ],
    };
    const user: IUserDocument | null = await UserModel.findOne(query).exec();
    return user;
  }

  public async getUserById(userId: string): Promise<IUserDocument | null> {
    const users: IUserDocument[] = await UserModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "Auth",
          localField: "authId",
          foreignField: "_id",
          as: "authId",
        },
      },
      {
        $unwind: "$authId",
      },
      {
        $project: this.aggregateProject(),
      },
    ]);
    return users[0];
  }
  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      {
        $match: { authId: new mongoose.Types.ObjectId(authId) },
      },
      {
        $lookup: {
          from: "Auth",
          localField: "authId",
          foreignField: "_id",
          as: "authId",
        },
      },
      {
        $unwind: "$authId",
      },
      {
        $project: this.aggregateProject(),
      },
    ]);
    return users[0];
  }
  private aggregateProject() {
    return {
      _id: 1,
      username: "$authId.username",
      uId: "$authId.uId",
      email: "$authId.email",
      avatarColor: "$authId.avatarColor",
      createdAt: "$authId.createdAt",
      postsCount: 1,
      work: 1,
      school: 1,
      quote: 1,
      location: 1,
      blocked: 1,
      blockedBy: 1,
      followersCount: 1,
      followingCount: 1,
      notifications: 1,
      social: 1,
      bgImageVersion: 1,
      bgImageId: 1,
      profilePicture: 1,
    };
  }
}

export const userService: UserService = new UserService();
