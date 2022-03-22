import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { audience, issuer, jwtRefreshSecret, jwtSecret } from "../config/keys.env";
import { FORBIDDEN } from "../config/keys.error";
import { Admin } from "../db/models";
import { DecodedToken } from "../interfaces/token";
import { createTokens, removeCookies } from "../utils/token";
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
          removeCookies(res);
          res.status(FORBIDDEN).redirect("/");
        } else {
          const { exp } = decodedToken as DecodedToken;
          if (Date.now() >= exp * 1000) {
            attemptRefresh(req, res, next);
          }
        }
      }
    );
  } else {
    removeCookies(res);
    res.status(FORBIDDEN).redirect("/");
  }
}

export function attemptRefresh(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.cookies[JWT_REFRESH_COOKIE_KEY];
  res.clearCookie(JWT_COOKIE_KEY);
  if (refreshToken) {
    verify(refreshToken, jwtRefreshSecret, { issuer, audience }, (err: any, decodedToken) => {
      if (err) {
        res.clearCookie(JWT_REFRESH_COOKIE_KEY);
        res.status(FORBIDDEN).redirect("/");
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
    res.status(FORBIDDEN).redirect("/");
  }
}

export function fillAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[JWT_COOKIE_KEY];
  if (token) {
    verify(token, jwtSecret, { issuer, audience }, async (err: any, decodedToken) => {
      try {
        if (err) {
          res.app.locals.auth = null;
        } else {
          if (!res.app.locals.auth) {
            const { id } = decodedToken as DecodedToken;
            const admin = await Admin.findById(id);
            res.app.locals.auth = admin;
          }
        }
      } catch (err) {
        res.app.locals.auth = null;
      }
    });
  } else {
    res.app.locals.auth = null;
  }

  next();
}
