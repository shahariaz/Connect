import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import JWT from "jsonwebtoken";
import { joiValidation } from "@global/decorators/joi-validation";
import { signupSchema } from "@auth/schemas/signup";
import { IAuthDocument, ISignUpData } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import { BadRequestError, ServerError } from "@global/helpers/error-handler";
import { Helpers } from "@global/helpers/helpers";
import { uploads } from "@global/helpers/cloudinary-upload";
import { IUserDocument } from "@user/interfaces/user.interface";
import { config } from "@root/config";
import { userCache } from "@service/redis/user.cache";
import Logger from "bunyan";
import { UploadApiResponse } from "cloudinary";
import { omit } from "lodash";
import { authQueue } from "@service/queue/auth.queue";
import { userQueue } from "@service/queue/user.queue";
const log: Logger = config.createLogger("signupController");

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExist: IAuthDocument | null =
      await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError("Invalid credentials");
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomInteger(12)}`;
    // the reason we are using SignUp.prototype.signupData and not this.signupData is because
    // of how we invoke the create method in the routes method.
    // the scope of the this object is not kept when the method is invoked
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor,
    });
    const result: UploadApiResponse = (await uploads(
      avatarImage,
      `${userObjectId}`,
      true,
      true
    )) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError("File upload: Error occurred. Try again.");
    }

    // Add to redis cache
    const userDataForCache: IUserDocument = SignUp.prototype.userData(
      authData,
      userObjectId
    );
    userDataForCache.profilePicture = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);
    // Add to queue to store in database
    omit(userDataForCache, ["uId", "username", "email", "avatarColor"]);
    //add AuthData to queue to store in database
    authQueue.addAuthUserJob("addAuthUserToDB", { value: authData });
    //add UserData to queue to store in database
    userQueue.addUserToDB("addUserToDB", { value: userDataForCache });
    //sign JWT token
    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJwt };
    //response
    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: `${userObjectId}`,
        uId,
        username: Helpers.firstLetterUpperCase(username),
        email: Helpers.lowerCase(email),
        avatarColor,
        profilePicture: userDataForCache.profilePicture,
      },
    });
  }
  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
      },
      config.JWT_TOKEN!
    );
  }
  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, uId, email, username, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUpperCase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date(),
    } as unknown as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUpperCase(username),
      email,
      password,
      avatarColor,
      profilePicture: "",
      blocked: [],
      blockedBy: [],
      work: "",
      location: "",
      school: "",
      quote: "",
      bgImageVersion: "",
      bgImageId: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true,
      },
      social: {
        facebook: "",
        instagram: "",
        twitter: "",
        youtube: "",
      },
    } as unknown as IUserDocument;
  }
}
