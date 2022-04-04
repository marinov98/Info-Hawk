import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_COOKIE_KEY, JWT_REFRESH_COOKIE_KEY } from "../config/keys.constants";
import { audience, issuer, JWT_REFRESH_SECRET, JWT_SECRET } from "../config/keys.env";

type Tokens = { accessToken: string; refreshToken: string };

export function createTokens(id: string, attempts: number = 0): Tokens {
  return {
    accessToken: jwt.sign({ id, attempts }, JWT_SECRET, { audience, issuer, expiresIn: "20m" }),
    refreshToken: jwt.sign({ id }, JWT_REFRESH_SECRET, {
      audience,
      issuer,
      expiresIn: "10 days"
    })
  };
}

export function setCookies(
  res: Response,
  { accessToken, refreshToken }: Tokens,
  includeRefresh = true
): void {
  const options: CookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000 * 30),
    secure: process.env.NODE_ENV === "production"
  };
  res.cookie(JWT_COOKIE_KEY, accessToken, options);

  if (includeRefresh) {
    options.signed = true;
    options.expires = new Date(Date.now() + 60 * 60 * 1000 * 24 * 10);

    res.cookie(JWT_REFRESH_COOKIE_KEY, refreshToken, options);
  }
}

export function removeCookies(res: Response) {
  res.clearCookie(JWT_COOKIE_KEY);
  res.clearCookie(JWT_REFRESH_COOKIE_KEY);
}
