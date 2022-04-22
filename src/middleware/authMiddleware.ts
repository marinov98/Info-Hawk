import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { audience, issuer, JWT_REFRESH_SECRET, JWT_SECRET } from "../config/keys.env";
import { FORBIDDEN } from "../config/keys.error";
import { Admin } from "../db/models";
import { DecodedToken } from "../interfaces/index";
import { createTokens, removeCookies, setCookies } from "../utils/token";
import { JWT_COOKIE_KEY, JWT_REFRESH_COOKIE_KEY } from "./../config/keys.constants";

export function monitorCookies(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.signedCookies[JWT_REFRESH_COOKIE_KEY];
  if (refreshToken) {
    const accessToken = req.cookies[JWT_COOKIE_KEY];
    if (accessToken) {
      verify(
        accessToken,
        JWT_SECRET,
        { ignoreExpiration: true, issuer, audience },
        (err: any, decoded) => {
          if (decoded) {
            const { exp, attempts } = decoded as DecodedToken;
            if (Date.now() >= exp * 1000) {
              const refreshesSoFar = attempts ? attempts : 0;
              attemptRefresh(refreshesSoFar, req, res);
            }
          }
        }
      );
    } else {
      attemptRefresh(-1, req, res);
    }
  }
  next();
}

export function fillAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[JWT_COOKIE_KEY];
  if (token) {
    verify(token, JWT_SECRET, { issuer, audience }, async (err: any, decodedToken) => {
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

export function cookieGuard(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies[JWT_COOKIE_KEY];

  if (token) {
    verify(token, JWT_SECRET, { issuer, audience }, async (err: any) => {
      if (err) {
        removeCookies(res);
        return res.status(FORBIDDEN).redirect("/login");
      } else {
        next();
      }
    });
  } else {
    removeCookies(res);
    return res.status(FORBIDDEN).redirect("/login");
  }
}

export function attemptRefresh(attempts: number, req: Request, res: Response): void {
  const refreshToken = req.signedCookies[JWT_REFRESH_COOKIE_KEY];
  res.clearCookie(JWT_COOKIE_KEY);
  if (refreshToken) {
    verify(refreshToken, JWT_REFRESH_SECRET, { issuer, audience }, (err: any, decodedToken) => {
      if (err) {
        res.clearCookie(JWT_REFRESH_COOKIE_KEY);
      } else {
        attempts++;
        const { id } = decodedToken as DecodedToken;
        const tokens = createTokens(id, attempts);
        if (attempts < 1 || attempts % 7 !== 0) {
          setCookies(res, tokens, false);
        } else {
          setCookies(res, tokens);
        }

        req.cookies[JWT_COOKIE_KEY] = tokens.accessToken;
      }
    });
  }
}

export function maintainAuth(req: Request, res: Response, next: NextFunction) {
  if (res.app.locals.auth && req.path !== "/") {
    return res.redirect("/");
  } else {
    next();
  }
}
