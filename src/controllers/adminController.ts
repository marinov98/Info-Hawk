import { NextFunction, Request, Response } from "express";
import { Admin } from "../db/models";
import { createTokens, removeCookies, setCookies } from "../utils/token";
import { BAD_REQUEST, CREATED, GOOD, UNKNOWN_ERR_MSG } from "./../config/keys.error";

export function register_get(req: Request, res: Response, next: NextFunction) {
  return res.render("register");
}

export function login_get(req: Request, res: Response, next: NextFunction) {
  return res.render("login");
}

export async function register_post(req: Request, res: Response, next: NextFunction) {
  const errors = { msg: UNKNOWN_ERR_MSG, src: "Register Controller", status: BAD_REQUEST };
  try {
    if (await Admin.findOne({ email: req.body.email })) {
      errors.msg = "User with this email already exists!";
      return res.status(BAD_REQUEST).json({ errors });
    }
    await Admin.create(req.body);
    return res.status(CREATED).json({ created: true });
  } catch (err) {
    if (err instanceof Error) {
      errors.msg = err.message;
    }
    return res.status(BAD_REQUEST).json({ errors });
  }
}

export async function login_post(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const data = await Admin.login(email, password);
    if ("src" in data) {
      return res.status(BAD_REQUEST).json({ errors: data });
    }
    const id: string = data._id.toString();

    setCookies(res, createTokens(id));
    return res.status(GOOD).json({ id });
  } catch (err) {
    console.error(err);
    const errors = { msg: UNKNOWN_ERR_MSG, src: "Login Controller", status: BAD_REQUEST };
    if (err instanceof Error) {
      errors.msg = err.message;
    }

    return res.status(BAD_REQUEST).json({ errors });
  }
}

export function logout_get(req: Request, res: Response, next: NextFunction) {
  removeCookies(res);
  return res.redirect("/");
}
