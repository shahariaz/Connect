import { Request, Response } from "express";
import { config } from "@root/config";
import JWT from "jsonwebtoken";
import { joiValidation } from "@global/decorators/joi-validation";
import HTTP_STATUS from "http-status-codes";
import { authService } from "@service/db/auth.service";

import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { BadRequestError } from "@global/helpers/error-handler";
import { userService } from "@service/db/user.service";
import { IUserDocument } from "@user/interfaces/user.interface";
import { loginSchema } from "@auth/schemas/signin";

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument | null =
      await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(
      password
    );
    if (!passwordsMatch) {
      throw new BadRequestError("Invalid credentials");
    }
    const user: IUserDocument | null = await userService.getUserByAuthId(
      `${existingUser._id}`
    );
    // if (!user) {
    //   throw new BadRequestError("User not found");
    // }
    const userJwt: string = JWT.sign(
      {
        userId: user!._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor,
      },
      config.JWT_TOKEN!
    );
    req.session = { jwt: userJwt };
    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt,
    } as IUserDocument;

    res.status(HTTP_STATUS.OK).json({
      message: "User login successfully",
      user: userDocument,
      token: userJwt,
    });
  }
}
