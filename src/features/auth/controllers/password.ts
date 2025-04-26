import { IAuthDocument } from "@auth/interfaces/auth.interface";
import { emailSchema, passwordSchema } from "@auth/schemas/password";
import { joiValidation } from "@global/decorators/joi-validation";
import { BadRequestError } from "@global/helpers/error-handler";
import { config } from "@root/config";
import { authService } from "@service/db/auth.service";
import { forgotPasswordTemplate } from "@service/emails/templates/forgot-password/forgot-password-template";
import { emailQueue } from "@service/queue/email.queue";
import { IResetPasswordParams } from "@user/interfaces/user.interface";
import crypto from "crypto";
import { Request, Response } from "express";
import HTTP_STATUS from "http-status-codes";
import publicIP from "ip";
import moment from "moment";
import { template } from "lodash";
import { resetPasswordTemplate } from "@service/emails/templates/reset-password/reset-password-template";
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
      Date.now() * 60 * 60 * 1000
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
  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError("Passwords do not match");
    }
    try {
      const existingUser: IAuthDocument | null =
        await authService.getUserByPasswordToken(token);
      if (!existingUser) {
        throw new BadRequestError("Reset token has expired or is invalid");
      }

      existingUser.password = password;
      existingUser.passwordResetToken = undefined;
      existingUser.passwordResetExpires = undefined;
      await existingUser.save();
      const templateParams: IResetPasswordParams = {
        username: existingUser.username,
        email: existingUser.email,
        ipaddress: publicIP.address(),
        date: moment().format("DD/MM/YYYY HH:mm"),
      };
      const template: string =
        resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
      emailQueue.addEmailJob("forgetPasswordEmail", {
        template,
        receiverEmail: existingUser.email,
        subject: "Password reset confirmation",
      });
      res.status(HTTP_STATUS.OK).json({
        message: "Password reset successfully",
        status: "success",
      });
    } catch (error) {
      throw new BadRequestError("Error resetting password");
    }
  }
}
