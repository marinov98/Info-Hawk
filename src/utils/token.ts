import jwt from "jsonwebtoken";
import { Response } from "express";
import { audience, issuer, jwtRefreshSecret, jwtSecret } from "../config/keys.env";

type Tokens = { accessToken: string; refreshToken: string };

export function createTokens(id: string): Tokens {
  return {
    accessToken: jwt.sign({ id }, jwtSecret, { audience, issuer, expiresIn: "70ms" }),
    refreshToken: jwt.sign({ id }, jwtRefreshSecret, {
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
  res.cookie("jwt", accessToken, options);

  options.expires = new Date(Date.now() + 37 * 100000 * 24 * 7);

  res.cookie("jwt-refresh", refreshToken, options);
}
