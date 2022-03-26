import { NextFunction, Request, Response } from "express";
import { BAD_REQUEST } from "../config/keys.error";
import { IHError } from "../types/errors";
import {
  loginSchema,
  registrationSchema,
  resetMailSchema,
  resetPassSchema
} from "../utils/validation";

export function validateInput(req: Request, res: Response, next: NextFunction) {
  const schema = getSchema(req.path);
  if (!schema) {
    next();
  } else {
    const { error } = schema.validate(req.body);
    if (error) {
      const hawkError: IHError = {
        src: "validationMiddleware",
        status: BAD_REQUEST,
        msg: error.details[0].message
      };
      return res.status(BAD_REQUEST).json({ hawkError });
    } else {
      delete req.body.confirmPassword;
    }
    next();
  }
}

function getSchema(path: string) {
  if (path === "/register") {
    return registrationSchema;
  }

  if (path === "/login") {
    return loginSchema;
  }

  if (path === "/passwordMail") {
    return resetMailSchema;
  }

  if (path.includes("reset")) {
    return resetPassSchema;
  }

  return null;
}
