import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { APP_EMAIL, audience, issuer, JWT_SECRET, PROTOCAL, TRANSPORTER } from "../config/keys.env";
import {
  BAD_REQUEST,
  NOT_FOUND,
  NOT_SAME_EMAIL_ERR,
  OK,
  TOKEN_RESET_ERR,
  TOKEN_RESET_PAYLOAD_ERR,
  UNAUTHORIZED,
  UNKNOWN_ERR_MSG
} from "../config/keys.error";
import { Admin, Token } from "../db/models";
import { TokenType } from "../db/schemas/tokenSchema";
import { ResetDecodedToken } from "../interfaces/index";
import { IHError } from "../types/errors";

export function reset_password_mail_get(req: Request, res: Response, next: NextFunction) {
  return res.render("auth/passwordMail");
}

export function token_expire_get(req: Request, res: Response, next: NextFunction) {
  return res.render("tokenExpired");
}

export async function reset_password_form_get(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const token = await Token.findOne({ value: req.params.token, type: TokenType.RESET });
    if (!token) return res.status(UNAUTHORIZED).redirect("/error/token");
    verify(token.value, JWT_SECRET, { issuer, audience }, async (err, decodedToken) => {
      if (err) {
        await Token.deleteOne({ value: token.value, type: TokenType.RESET });
        return res.status(UNAUTHORIZED).redirect("/error/token");
      }
      const { email } = decodedToken as ResetDecodedToken;
      if (!(await Admin.findOne({ email }))) {
        await Token.deleteOne({ value: token.value, type: TokenType.RESET });
        return res.status(NOT_FOUND).redirect("/error/token");
      }

      return res.render("auth/passwordReset");
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
    await Token.deleteMany({ owner: user._id.toString(), type: TokenType.RESET });
    const accessToken: string = sign({ email }, JWT_SECRET, { audience, issuer, expiresIn: "15m" });
    await Token.create({ owner: user._id.toString(), value: accessToken, type: TokenType.RESET });
    const { messageId } = await TRANSPORTER.sendMail({
      from: APP_EMAIL,
      to: email,
      subject: "Info Hawk Password Reset",
      text: `Please click to link below to reset your password:
      ${PROTOCAL}://${req.headers.host}/passwordReset/${accessToken}`
    });
    return res.status(OK).json({ message: `A reset link was sent to your email`, messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function reset_password_form_patch(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const token = await Token.findOne({ value: req.params.token, type: TokenType.RESET });
    if (!token) {
      hawkError.msg = TOKEN_RESET_ERR;
      hawkError.status = UNAUTHORIZED;
      return res.status(hawkError.status).json({ hawkError });
    }
    verify(token.value, JWT_SECRET, { issuer, audience }, async (err, decodedToken) => {
      if (err) {
        await Token.deleteOne({ value: token.value, type: TokenType.RESET });
        hawkError.msg = TOKEN_RESET_ERR;
        hawkError.status = UNAUTHORIZED;
        return res.status(hawkError.status).json({ hawkError });
      }
      const { email } = decodedToken as ResetDecodedToken;
      const { newPassword } = req.body;
      const admin = await Admin.findOne({ email });

      if (!admin) {
        await Token.deleteOne({ value: token.value, type: TokenType.RESET });
        hawkError.msg = TOKEN_RESET_PAYLOAD_ERR;
        hawkError.status = UNAUTHORIZED;
        return res.status(hawkError.status).json({ hawkError });
      }

      admin.password = newPassword;
      await admin.save();
      const { messageId } = await TRANSPORTER.sendMail({
        from: APP_EMAIL,
        to: email,
        subject: "Info Hawk Password Change Confirmation",
        text: "We are sending you this email to let you know that your password was changed"
      });
      await Token.deleteOne({ value: token.value, type: TokenType.RESET });
      return res.status(OK).json({ message: "Password reset successfully!", messageId });
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(hawkError.status).json({ hawkError });
  }
}
