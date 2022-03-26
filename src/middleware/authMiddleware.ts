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
          return res.status(FORBIDDEN).redirect("/login");
        } else {
          const { exp } = decodedToken as DecodedToken;
          if (Date.now() >= exp * 1000) {
            attemptRefresh(req, res, next);
          } else {
            next();
          }
        }
      }
    );
  } else {
    removeCookies(res);
    return res.status(FORBIDDEN).redirect("/login");
  }
}

export function attemptRefresh(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.cookies[JWT_REFRESH_COOKIE_KEY];
  res.clearCookie(JWT_COOKIE_KEY);
  if (refreshToken) {
    verify(refreshToken, jwtRefreshSecret, { issuer, audience }, (err: any, decodedToken) => {
      if (err) {
        res.clearCookie(JWT_REFRESH_COOKIE_KEY);
        return res.status(FORBIDDEN).redirect("/login");
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
    return res.status(FORBIDDEN).redirect("/login");
  }
}

export function fillAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[JWT_COOKIE_KEY];
  if (token) {
    verify(token, jwtSecret, { issuer, audience }, async (err: any, decodedToken) => {
      if (err) {
        res.app.locals.auth = null;
      } else if (!res.app.locals.auth) {
        const { id } = decodedToken as DecodedToken;
        res.app.locals.auth = await Admin.findById(id);
      }
      next();
    });
  } else {
    res.app.locals.auth = null;
    next();
  }
}

export function maintainAuth(req: Request, res: Response, next: NextFunction) {
  if (res.app.locals.auth && req.path !== "/") {
    return res.redirect("/");
  } else {
    next();
  }
}
