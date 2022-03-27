import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { appEmail, audience, issuer, jwtSecret, transporter } from "../config/keys.env";
import {
  BAD_REQUEST,
  GOOD,
  NOT_FOUND,
  NOT_SAME_EMAIL_ERR,
  TOKEN_RESET_ERR,
  TOKEN_RESET_PAYLOAD_ERR,
  UNAUTHORIZED,
  UNKNOWN_ERR_MSG
} from "../config/keys.error";
import { Admin } from "../db/models";
import { ResetDecodedToken } from "../interfaces/token";
import { IHError } from "../types/errors";

export function reset_password_mail_get(req: Request, res: Response, next: NextFunction) {
  return res.render("passwordMail");
}

export function token_expire_get(req: Request, res: Response, next: NextFunction) {
  return res.render("tokenExpired");
}

export function reset_password_form_get(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const token = req.params.token;
    verify(token, jwtSecret, { issuer, audience }, async (err, decodedToken) => {
      if (err) {
        return res.status(UNAUTHORIZED).redirect("/error/token");
      }
      const { email } = decodedToken as ResetDecodedToken;
      if (await Admin.findOne({ email })) {
        return res.render("passwordReset");
      } else {
        return res.status(NOT_FOUND).redirect("/error/token");
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(BAD_REQUEST).json({ hawkError });
  }
}

export async function reset_password_mail_post(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const { email } = req.body;
    const user = await Admin.findOne({ email });
    if (!user) {
      hawkError.msg = NOT_SAME_EMAIL_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const accessToken: string = sign({ email }, jwtSecret, { audience, issuer, expiresIn: "20m" });
    const { messageId } = await transporter.sendMail({
      from: appEmail,
      to: email,
      subject: "Info Hawk Password Reset",
      text: `Please click to link below to reset your password:
      ${req.protocol}://${req.headers.host}/passwordReset/${accessToken}`
    });
    return res.status(GOOD).json({ message: `A reset link was sent to your email`, messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(hawkError.status).json({ hawkError });
  }
}

export function reset_password_form_put(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const token = req.params.token;
    verify(token, jwtSecret, { issuer, audience }, async (err, decodedToken) => {
      if (err) {
        hawkError.msg = TOKEN_RESET_ERR;
        hawkError.status = UNAUTHORIZED;
        return res.status(hawkError.status).json({ hawkError });
      }
      const { email } = decodedToken as ResetDecodedToken;
      const { newPassword } = req.body;
      const admin = await Admin.findOne({ email });
      if (admin) {
        admin.password = newPassword;
        await admin.save();
        const { messageId } = await transporter.sendMail({
          from: appEmail,
          to: email,
          subject: "Info Hawk Password Change Confirmation",
          text: "We are sending you this email to let you know that your password was changed"
        });
        return res.status(GOOD).json({ message: "Password reset successfully!", messageId });
      } else {
        hawkError.msg = TOKEN_RESET_PAYLOAD_ERR;
        hawkError.status = UNAUTHORIZED;
        return res.status(hawkError.status).json({ hawkError });
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(hawkError.status).json({ hawkError });
  }
}
