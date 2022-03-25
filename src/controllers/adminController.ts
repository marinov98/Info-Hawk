import { NextFunction, Request, Response } from "express";
import { Admin } from "../db/models";
import { IHError } from "../types/errors";
import { createTokens, removeCookies, setCookies } from "../utils/token";
import { BAD_REQUEST, CREATED, GOOD, UNKNOWN_ERR_MSG } from "./../config/keys.error";

export function register_get(_: Request, res: Response, __: NextFunction) {
  return res.render("register");
}

export function login_get(_: Request, res: Response, __: NextFunction) {
  return res.render("login");
}

export async function register_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    src: "Register Controller",
    status: BAD_REQUEST
  };
  try {
    if (await Admin.findOne({ email: req.body.email })) {
      hawkError.msg = "User with this email already exists!";
      return res.status(BAD_REQUEST).json({ hawkError });
    }
    await Admin.create(req.body);
    return res.status(CREATED).json({ created: true });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }
    return res.status(BAD_REQUEST).json({ hawkError });
  }
}

export async function login_post(req: Request, res: Response, _: NextFunction) {
  try {
    const { email, password } = req.body;
    const data = await Admin.login(email, password);
    if ("src" in data) {
      return res.status(BAD_REQUEST).json({ hawkError: data });
    }
    const id: string = data._id.toString();

    setCookies(res, createTokens(id));
    return res.status(GOOD).json({ id });
  } catch (err) {
    console.error(err);
    const hawkError: IHError = {
      msg: UNKNOWN_ERR_MSG,
      src: "Login Controller",
      status: BAD_REQUEST
    };
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(BAD_REQUEST).json({ hawkError });
  }
}

export function logout_get(req: Request, res: Response, _: NextFunction) {
  removeCookies(res);
  return res.redirect("/");
}
