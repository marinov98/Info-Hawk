import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { audience, issuer, jwtSecret } from "../config/keys.env";

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.jwt;

  if (token) {
    verify(
      token,
      jwtSecret,
      { ignoreExpiration: true, issuer, audience },
      async (err: any, decodedToken) => {
        console.log(decodedToken);
        if (err) {
          console.error(err.message);
          res.redirect("/");
        } else {
          // refresh logic goes here
          next();
        }
      }
    );
  } else {
    res.redirect("/");
  }
}

export function refreshAdmin(res: Response, id: string): void {}
