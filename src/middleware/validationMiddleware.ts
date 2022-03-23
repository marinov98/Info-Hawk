import { NextFunction, Request, Response } from "express";
import { BAD_REQUEST } from "../config/keys.error";
import { IHError } from "../types/errors";
import { loginSchema, registrationSchema } from "../utils/validation";

export function validateInput(req: Request, res: Response, next: NextFunction) {
  let schema = null;
  if (req.path === "/register") {
    schema = registrationSchema;
  } else if (req.path === "/login") {
    schema = loginSchema;
  }

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
