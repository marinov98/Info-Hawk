import { Request, Response, NextFunction } from "express";
import { Admin } from "../db/models";
import { createTokens } from "../utils/token";

export function login_get(req: Request, res: Response, next: NextFunction) {
  return res.render("login");
}

export async function login_post(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const res = await Admin.login(email, password);
    return {};
  } catch (err) {
    console.error(err);
  }
}
