import jwt from "jsonwebtoken";
import { audience, issuer, jwtSecret } from "../config/keys";

type Tokens = { accessToken: string; refreshToken: string };

export function createTokens(id: string): Tokens {
  return {
    accessToken: jwt.sign({ id }, jwtSecret, { audience, issuer, expiresIn: "1h" }),
    refreshToken: jwt.sign({ id }, jwtSecret, {
      audience,
      issuer,
      expiresIn: "7 days"
    })
  };
}
