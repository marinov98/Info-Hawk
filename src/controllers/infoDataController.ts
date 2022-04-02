import { NextFunction, Request, Response } from "express";
import { APP_EMAIL, TRANSPORTER } from "../config/keys.env";
import {
  BAD_REQUEST,
  CREATED,
  FORM_CREATE_ERR,
  FORM_EDIT_CODE_ERR,
  FORM_EDIT_DOC_ERR,
  FORM_LINK_ADMIN_ERR,
  NOT_FOUND,
  OK,
  UNKNOWN_ERR_MSG
} from "../config/keys.error";
import { Admin, Form } from "../db/models";
import { IHError } from "../types/errors";

export function info_data_create_get(_: Request, res: Response, __: NextFunction) {
  return res.render("infoData/infoDataCREATE");
}

export async function info_data_link_get(req: Request, res: Response, _: NextFunction) {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.redirect("/");

    return res.render("infoData/infoDataLink", { formId: form._id });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_client_get(req: Request, res: Response, _: NextFunction) {
  try {
    const { adminId, formId } = req.params;
    const form = await Form.findOne({ _id: formId, adminId, isSkeleton: true });
    if (!(await Admin.findById(adminId)) || !form) return res.redirect("/");

    return res.render("infoData/infoDataClient", { form });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_view_get(req: Request, res: Response, _: NextFunction) {
  const id = req.params.id;
  let form = null;
  try {
    form = await Form.findById(id);
    if (!form) {
      res.redirect("/");
    }

    return res.render("infoData/infoDataVIEW", { form });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_create_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    const { form } = req.body;
    const admin = await Admin.findOne({ code: form.code });
    if (
      !admin ||
      (await Form.findOne({ adminId: admin._id, title: form.title, isSkeleton: true }))
    ) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_CREATE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    delete form.code;
    form.adminId = admin._id;
    await Form.create(form);
    return res.status(CREATED).json({ msg: "Form successfully created!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_edit_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    console.log("hit endpoint!");
    const { form } = req.body;
    const admin = await Admin.findOne({ code: form.code });
    if (!admin) {
      console.log("ADMIN NOT FOUND");
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_CODE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const formToUpdate = await Form.findOne({
      adminId: admin._id,
      title: form.title,
      isSkeleton: true
    });
    if (!formToUpdate) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_DOC_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    delete form.code;
    form.adminId = formToUpdate.adminId;
    form._id = formToUpdate._id;
    await formToUpdate.deleteOne();
    await Form.create(form);
    return res.status(OK).json({ msg: "Form successfully updated!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_edit_delete(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    const { title, code } = req.body;
    const admin = await Admin.findOne({ code });
    if (!admin) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_CODE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const deleteDoc = await Form.findOneAndDelete({ adminId: admin._id, title, isSkeleton: true });
    if (!deleteDoc) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = "Something went wrong with deletion...";
      return res.status(hawkError.status).json({ hawkError });
    }

    return res.status(OK).json({ msg: "Form sucessfully deleted!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_link_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };

  try {
    const { adminId, formId } = req.params;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_LINK_ADMIN_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }

    const form = await Form.findById(formId);
    if (!form) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_LINK_ADMIN_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const { userEmail } = req.body;
    const { messageId } = await TRANSPORTER.sendMail({
      from: APP_EMAIL,
      to: userEmail,
      subject: `Info Hawk Form Link from ${admin.firstName}`,
      text: `${admin.firstName} has sent you a form to fill, you can fill it out at ${req.protocol}://${req.headers.host}/client/form-submission/${adminId}/${formId}`
    });

    return res.status(OK).json({ message: "Form link sent successfully!", messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}
