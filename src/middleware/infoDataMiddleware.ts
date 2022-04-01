import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { BAD_REQUEST } from "../config/keys.error";
import { IHError } from "../types/errors";

const formSchema = Joi.object({
  title: Joi.string().min(1).required(),
  "Admin Code": Joi.string().length(10)
});

export function validateForm(req: Request, res: Response, next: NextFunction) {
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
        if (key !== "title" && key !== "code") {
          err = Joi.boolean().validate(val).error;
        }
        if (err) {
          return;
        }
      });
    }

    if (!err) {
      req.body.form.isSkeleton = true;
      req.body;
      next();
    } else {
      hawkError.msg = err.details[0].message;
      res.status(hawkError.status).json({ hawkError });
    }
  } else {
    return res.status(hawkError.status).json({ hawkError });
  }
}
