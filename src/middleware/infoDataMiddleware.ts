import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { BAD_REQUEST } from "../config/keys.error";
import { IHError } from "../types/errors";

const formSchema = Joi.object({
  title: Joi.string().min(1).required(),
  "Admin Code": Joi.string().length(10).required()
});

const inputSchema = Joi.object({
  input: Joi.string().min(1).required(),
  originalOptions: Joi.string(),
  inputType: Joi.string().valid("single", "mc-single", "mc-multiple").required()
});

export function validateSkeleton(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = {
    msg: "required data not found!",
    src: "infoDataMiddleware",
    status: BAD_REQUEST
  };
  if (req.body.form) {
    const { title, code } = req.body.form;
    let err: Joi.ValidationError | undefined;
    err = formSchema.validate({ title, "Admin Code": code }).error;
    if (!err) {
      Object.entries(req.body.form).forEach(([key, val]) => {
        if (err) {
          return;
        }

        if (!["isSkeleton", "code", "title"].includes(key)) {
          err = inputSchema.validate(val).error;
        }
      });
    }

    if (!err) {
      req.body.form.isSkeleton = true;
      next();
    } else {
      hawkError.msg = err.details[0].message;
      res.status(hawkError.status).json({ hawkError });
    }
  } else {
    return res.status(hawkError.status).json({ hawkError });
  }
}

export function validateSubmission(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = {
    msg: "required data not found!",
    src: "infoDataMiddleware",
    status: BAD_REQUEST
  };
  if (req.body.form) {
    const { title, code } = req.body.form;
    let err: Joi.ValidationError | undefined;
    err = formSchema.validate({ title, "Admin Code": code }).error;
    if (!err) {
      Object.entries(req.body.form).forEach(([key, val]) => {
        if (err) {
          return;
        }

        if (!["isSkeleton", "title", "code"].includes(key)) {
          err = inputSchema.validate(val).error;
        }
      });
    }

    if (!err) {
      req.body.form.isSkeleton = false;
      next();
    } else {
      hawkError.msg = err.details[0].message;
      res.status(hawkError.status).json({ hawkError });
    }
  } else {
    return res.status(hawkError.status).json({ hawkError });
  }
}

export function validateDeleteVars(req: Request, res: Response, next: NextFunction) {
  const hawkError: IHError = {
    msg: "required data not found!",
    src: "infoDataMiddleware",
    status: BAD_REQUEST
  };
  const { title, code } = req.body;
  if (title && code) {
    const { error } = formSchema.validate({ title, "Admin Code": code });
    if (error) {
      hawkError.msg = error.details[0].message;
      res.status(hawkError.status).json({ hawkError });
    } else {
      next();
    }
  } else {
    res.status(hawkError.status).json({ hawkError });
  }
}

export function ensureVerified(_: Request, res: Response, next: NextFunction) {
  if (res.app.locals.auth && res.app.locals.auth.code.length !== 10) {
    return res.redirect("/");
  } else {
    next();
  }
}
