import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import Logger from "bunyan";
import sendGridMail from "@sendgrid/mail";
import { config } from "@root/config";
import { BadRequestError } from "@global/helpers/error-handler";

interface IMailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
}

const log: Logger = config.createLogger("MailTransport");
sendGridMail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {
  public async sendMial(
    receiverEmail: string,
    subject: string,
    body: string
  ): Promise<void> {
    if (config.NODE_ENV === "production") {
      await this.productionEmailSender(receiverEmail, subject, body);
    } else {
      await this.developmentEmailSender(receiverEmail, subject, body);
    }
  }
  private async productionEmailSender(
    receiverEmail: string,
    subject: string,
    body: string
  ): Promise<void> {
    const mailOptions: IMailOptions = {
      from: config.SENDER_EMAIL!,
      to: receiverEmail,
      subject: subject,
      html: body,
    };
    try {
      await sendGridMail.send(mailOptions);
      log.info("Email sent successfully");
    } catch (error) {
      log.error(`Error sending email: ${error}`);
      throw new BadRequestError("Email not sent");
    }
  }
  private async developmentEmailSender(
    receiverEmail: string,
    subject: string,
    body: string
  ): Promise<void> {
    const transporter: Mail = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: config.SENDER_EMAIL,
        pass: config.SENDER_EMAIL_PASSWORD,
      },
    });
    const mailOptions: IMailOptions = {
      from: config.SENDER_EMAIL!,
      to: receiverEmail,
      subject: subject,
      html: body,
    };
    try {
      await transporter.sendMail(mailOptions);
      log.info("Email sent successfully");
    } catch (error) {
      log.error(`Error sending email: ${error}`);
      throw new BadRequestError("Email not sent");
    }
  }
}
export const mailTransport: MailTransport = new MailTransport();
