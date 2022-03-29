import { Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_COOKIE_KEY, JWT_REFRESH_COOKIE_KEY } from "../config/keys.constants";
import { audience, issuer, JWT_REFRESH_SECRET, JWT_SECRET } from "../config/keys.env";

type Tokens = { accessToken: string; refreshToken: string };

export function createTokens(id: string): Tokens {
  return {
    accessToken: jwt.sign({ id }, JWT_SECRET, { audience, issuer, expiresIn: "1h" }),
    refreshToken: jwt.sign({ id }, JWT_REFRESH_SECRET, {
      audience,
      issuer,
      expiresIn: "7 days"
    })
  };
}

export function setCookies(res: Response, { accessToken, refreshToken }: Tokens): void {
  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + 37 * 100000),
    secure: process.env.NODE_ENV === "production"
  };
  res.cookie(JWT_COOKIE_KEY, accessToken, options);

  options.expires = new Date(Date.now() + 37 * 100000 * 24 * 7);

  res.cookie(JWT_REFRESH_COOKIE_KEY, refreshToken, options);
}

export function removeCookies(res: Response) {
  res.clearCookie(JWT_COOKIE_KEY);
  res.clearCookie(JWT_REFRESH_COOKIE_KEY);
}
