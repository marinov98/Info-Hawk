import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { audience, issuer, jwtRefreshSecret, jwtSecret } from "../config/keys.env";
import { DecodedToken } from "../interfaces/token";
import { createTokens } from "../utils/token";
import { JWT_COOKIE_KEY, JWT_REFRESH_COOKIE_KEY } from "./../config/keys.constants";

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[JWT_COOKIE_KEY];

  if (token) {
    verify(
      token,
      jwtSecret,
      { ignoreExpiration: true, issuer, audience },
      async (err: any, decodedToken) => {
        if (err) {
          console.error(err.message);
          res.redirect("/");
        } else {
          const { exp } = decodedToken as DecodedToken;
          if (Date.now() >= exp * 1000) {
            attemptRefresh(req, res, next);
          }
        }
      }
    );
  } else {
    res.redirect("/");
  }
}

export function attemptRefresh(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.cookies[JWT_REFRESH_COOKIE_KEY];
  res.clearCookie(JWT_COOKIE_KEY);
  if (refreshToken) {
    verify(refreshToken, jwtRefreshSecret, { issuer, audience }, async (err: any, decodedToken) => {
      if (err) {
        res.clearCookie(JWT_REFRESH_COOKIE_KEY);
        res.redirect("/");
      } else {
        const { id } = decodedToken as DecodedToken;
        const { accessToken } = createTokens(id);
        const options = {
          httpOnly: true,
          expires: new Date(Date.now() + 37 * 100000),
          secure: process.env.NODE_ENV === "production"
        };
        res.cookie(JWT_COOKIE_KEY, accessToken, options);
        next();
      }
    });
  } else {
    console.error("refresh token not found!");
    res.redirect("/");
  }
}
