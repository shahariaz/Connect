import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { emailSchema, passwordSchema } from "@auth/schemas/password";
import { joiValidation } from "@global/decorators/joi-validation";
import { BadRequestError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { authService } from "@service/db/auth.service";
import { forgotPasswordTemplate } from "@service/emails/templates/forgot-password/forgot-password-template";
import { emailQueue } from "@service/queue/email.queue";
import crypto from "crypto";
import { Request, Response } from "express";
import HTTP_STATUS from "http-status-codes";
export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDocument | null = await authService.getUserByEmail(
      email
    );
    if (!existingUser) {
      throw new BadRequestError("User not found");
    }
    const randomByte: Buffer = await Promise.resolve(crypto.randomBytes(32));
    const token: string = randomByte.toString("hex");
    await authService.updatePasswordToken(
      `${existingUser._id}`,
      token,
      Date.now() * 60 * 60 * 100
    );
    const resetLink = `${config.CLIENT_URL}/reset-password?token=${token}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate(
      existingUser.username,
      resetLink
    );
    emailQueue.addEmailJob("forgetPasswordEmail", {
      template,
      receiverEmail: email,
      subject: "Reset your password",
    });
    res.status(HTTP_STATUS.OK).json({
      message: "Password reset link sent to your email",
      status: "success",
    });
  }
}
