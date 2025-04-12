import { ObjectId } from "mongoose";
import { Request, Response } from "express";
import { joiValidation } from "@global/decorators/joi-validation";
import { signupSchema } from "@auth/schemas/signup";
import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import { BadRequestError } from "@global/helpers/error-handler";

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument | null =
      await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExists) {
      throw new BadRequestError("Username or email already exists");
    }
  }
}
