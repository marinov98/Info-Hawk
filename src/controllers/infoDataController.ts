import { NextFunction, Request, Response } from "express";
import {
  BAD_REQUEST,
  CREATED,
  FORM_CREATE_ERR,
  NOT_FOUND,
  UNKNOWN_ERR_MSG
} from "../config/keys.error";
import { Admin, Form } from "../db/models";
import { IHError } from "../types/errors";

export function info_data_create_get(_: Request, res: Response, __: NextFunction) {
  return res.render("infoData/infoDataCREATE");
}

export function info_data_edit_get(_: Request, res: Response, __: NextFunction) {
  return res.render("infoData/infoDataEDIT");
}

export function info_data_view_get(_: Request, res: Response, __: NextFunction) {
  return res.render("infoData/infoDataVIEW");
}

export async function info_data_create_post(req: Request, res: Response, __: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    const { form } = req.body;
    const admin = await Admin.findOne({ code: form.code });
    if (!admin || (await Form.findOne({ adminId: admin._id, title: form.title }))) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_CREATE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    delete form.code;
    form.adminId = admin._id.toString();
    await Form.create(form);
    return res.status(CREATED).json({ msg: "Form successfully created!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}
export async function info_data_view_skeletons_get(
  req: Request,
  res: Response,
  next: NextFunction
) {}
