import { ObjectId } from "mongodb";
import { Request, Response } from "express";
import { joiValidation } from "@global/decorators/joi-validation";
import { signupSchema } from "@auth/schemas/signup";
import { IAuthDocument, ISignUpData } from "@auth/interfaces/auth.interface";
import { authService } from "@service/db/auth.service";
import { BadRequestError } from "@global/helpers/error-handler";
import { Helpers } from "@global/helpers/helpers";
import { UploadApiResponse } from "cloudinary";
import { uploads } from "@global/helpers/cloudinary-upload";

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExists: IAuthDocument | null =
      await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExists) {
      throw new BadRequestError("Username or email already exists");
    }
    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomInteger(12)}`;
    const authData:IAuthDocument= SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      email,
      username,
      password,
      avatarColor,
    })
    const result = await uploads(avatarImage,`${userObjectId}`,true,true)
    if(!result?.public_id){
      throw new BadRequestError("Error uploading image")
    }
  }
  private signupData = (data:ISignUpData):IAuthDocument{
    const { _id, uId, email, username, password, avatarColor } = data;
    return{
      _id,
      uId,
      username:Helpers.firstLetterUpperCase(username),
      email:Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date(), 

    } as unknown as IAuthDocument;
  }
}
