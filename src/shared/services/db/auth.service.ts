import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { AuthModel } from "@auth/models/auth.schema";
import { Helpers } from "@global/helpers/helpers";

class AuthService {
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }
  public async getUserByUsernameOrEmail(
    username: string,
    email: string
  ): Promise<IAuthDocument | null> {
    const query = {
      $or: [
        { username: Helpers.firstLetterUpperCase(username) },
        { email: Helpers.lowerCase(email) },
      ],
    };
    const user: IAuthDocument | null = await AuthModel.findOne(query).exec();
    return user;
  }
  public async getAuthUserByUsername(
    username: string
  ): Promise<IAuthDocument | null> {
    const user: IAuthDocument | null = await AuthModel.findOne({
      username: Helpers.firstLetterUpperCase(username),
    }).exec();
    return user;
  }
  public async getUserByAuthId(authId: string) {
    const user: IAuthDocument | null = await AuthModel.findById(authId).exec();
    return user;
  }
}
export const authService: AuthService = new AuthService();
