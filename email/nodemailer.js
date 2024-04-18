import nodemailer from "nodemailer";
import {
  acceptanceEmailTemplate,
  confirmEmailTemplate,
  resetPasswordTemplate,
} from "./html.js";

export const sendEmail = async (
  options,
  token,
  protocol,
  host,
  action,
  messageType
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    tls: {
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.email,
      pass: process.env.emailpass,
    },
  });

  try {
    let subject = "";

    switch (messageType) {
      case "confirmEmail":
        subject = "Confirm Email";
        break;
      case "resetPassword":
        subject = "Reset Password";
        break;
      case "acceptanceEmail":
        subject = "Welcome to Fitness Platform!";
        break;
      default:
        subject = "Notification from Fitness Platform"; 
    }
    const fullName = `${options.firstName} ${options.lastName}` ;
    const OTP = options.OTP;

    const html = (() => {
      switch (messageType) {
        case "confirmEmail":
          return confirmEmailTemplate(fullName, OTP);
        case "resetPassword":
          return resetPasswordTemplate(fullName, OTP);
        case "acceptanceEmail":
          const signInLink = `${protocol}://${host}/signin`;
          return acceptanceEmailTemplate(fullName, signInLink);
        default:
          return "";
      }
    })();
    const info = await transporter.sendMail({
      from: `"Fitness Platform" <${process.env.email}>`,
      to: options.email,
      subject: subject,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};
