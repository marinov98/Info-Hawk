import { NextFunction, Request, Response } from "express";
import { sign, verify } from "jsonwebtoken";
import { JWT_COOKIE_KEY } from "../config/keys.constants";
import {
  APP_EMAIL,
  audience,
  issuer,
  JWT_SECRET,
  PROTOCAL,
  REDIS_CLIENT,
  TRANSPORTER
} from "../config/keys.env";
import { Admin, Form, Token } from "../db/models";
import { TokenType } from "../db/schemas/tokenSchema";
import { ResetDecodedToken } from "../interfaces/index";
import { IHError } from "../types/errors";
import { generateAdminCode } from "../utils/code";
import { cleanSession } from "../utils/session";
import { createTokens, removeCookies, setCookies } from "../utils/token";
import {
  BAD_REQUEST,
  CREATED,
  NOT_FOUND,
  NOT_SAME_EMAIL_ERR,
  OK,
  SAME_EMAIL_ERR,
  UNAUTHORIZED,
  UNKNOWN_ERR_MSG
} from "./../config/keys.error";

export function register_get(_: Request, res: Response, __: NextFunction) {
  return res.render("auth/register");
}

export function login_get(_: Request, res: Response, __: NextFunction) {
  return res.render("auth/login");
}

export function settings_get(_: Request, res: Response, __: NextFunction) {
  return res.render("auth/settings");
}

export function deleteAcc_get(_: Request, res: Response, __: NextFunction) {
  return res.render("auth/account");
}

export async function register_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    src: "Register Controller",
    status: BAD_REQUEST
  };
  try {
    if (await Admin.findOne({ email: req.body.email })) {
      hawkError.msg = SAME_EMAIL_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const admin = await Admin.create(req.body);
    const accessToken: string = sign({ email: req.body.email }, JWT_SECRET, {
      audience,
      issuer,
      expiresIn: "30m"
    });

    await Token.create({ value: accessToken, owner: admin._id.toString() });

    const { messageId } = await TRANSPORTER.sendMail({
      to: req.body.email,
      from: APP_EMAIL,
      subject: "Welcome to Info Hawk!",
      text: `We are pleased for you to join Info Hawk. In order to use our functionality, please verify your email using this link ${PROTOCAL}://${req.headers.host}/auth/verify/${accessToken}`
    });
    return res.status(CREATED).json({ msg: "Registration Successful!", messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function verify_email_get(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = { src: "resetController", msg: UNKNOWN_ERR_MSG, status: BAD_REQUEST };
  try {
    const token = await Token.findOne({ value: req.params.token });
    if (!token) return res.status(UNAUTHORIZED).redirect("/error/token");
    verify(token.value, JWT_SECRET, { issuer, audience }, async (err, decodedToken) => {
      if (err) {
        await Token.deleteOne({ value: token.value });
        return res.status(UNAUTHORIZED).redirect("/error/token");
      }
      const { email } = decodedToken as ResetDecodedToken;
      const admin = await Admin.findOne({ email });
      if (!admin) {
        await Token.deleteOne({ value: token.value });
        return res.status(NOT_FOUND).redirect("/error/token");
      }
      const code = generateAdminCode();
      const updatedAdmin = await admin.updateOne({ code });
      if (!updatedAdmin) {
        await Token.deleteOne({ value: token.value });
        hawkError.status = NOT_FOUND;
        return res.status(hawkError.status).json({ hawkError });
      }
      if (req.cookies[JWT_COOKIE_KEY] && res.app.locals.auth) {
        res.app.locals.auth.code = code;
      }
      await Token.deleteOne({ value: token.value });
      return res.redirect("/");
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    console.error(err);
    return res.status(BAD_REQUEST).json({ hawkError });
  }
}

export async function login_post(req: Request, res: Response, _: NextFunction) {
  try {
    const { email, password } = req.body;
    const data = await Admin.login(email, password);
    if ("src" in data) {
      return res.status(data.status).json({ hawkError: data });
    }
    const id: string = data._id.toString();

    setCookies(res, createTokens(id));
    return res.status(OK).json({ id });
  } catch (err) {
    const hawkError: IHError = {
      msg: UNKNOWN_ERR_MSG,
      src: "Login Controller",
      status: BAD_REQUEST
    };
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function logout_get(req: Request, res: Response, __: NextFunction) {
  const adminId = res.app.locals.auth._id;
  await REDIS_CLIENT.del(`${adminId.toString()}-home`);
  await REDIS_CLIENT.del(`${adminId.toString()}-submissions`);
  cleanSession(req);
  removeCookies(res);
  return res.redirect("/");
}

export async function home_resend_link_post(req: Request, res: Response, __: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    src: "Admin Controller",
    status: BAD_REQUEST
  };
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = NOT_SAME_EMAIL_ERR;
      return res.status(NOT_FOUND).json({ hawkError });
    }
    await Token.deleteMany({ owner: admin._id.toString(), type: TokenType.VERIFY });
    const accessToken: string = sign({ email }, JWT_SECRET, {
      audience,
      issuer,
      expiresIn: "10m"
    });

    await Token.create({ value: accessToken, owner: admin._id.toString() });
    const { messageId } = await TRANSPORTER.sendMail({
      to: email,
      from: APP_EMAIL,
      subject: "Welcome to Info Hawk!",
      text: `We are pleased for you to join Info Hawk. In order to use our functionality, please verify your email using this link ${PROTOCAL}://${req.headers.host}/auth/verify/${accessToken}`
    });
    return res.status(OK).json({ message: "Link resent!", messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function auth_account_delete(req: Request, res: Response, __: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    src: "Admin Controller",
    status: BAD_REQUEST
  };
  try {
    const { id } = req.body;
    await Form.deleteMany({ adminId: id });
    await Token.deleteMany({ owner: id });
    await Admin.findByIdAndDelete(id);
    removeCookies(res);
    return res.status(OK).json({ msg: "Account deleted successfully!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}
