import { NextFunction, Request, Response } from "express";
import { APP_EMAIL, PROTOCAL, REDIS_CLIENT, TRANSPORTER } from "../config/keys.env";
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
import { cleanSession, updateSession } from "../utils/session";

export function info_data_create_get(_: Request, res: Response, __: NextFunction) {
  return res.render("forms/infoDataCREATE");
}

export async function info_data_link_get(req: Request, res: Response, _: NextFunction) {
  try {
    const adminId = res.app.locals.auth._id;
    const form = await Form.findOne({ _id: req.params.id, adminId });
    if (!form) return res.redirect("/");
    cleanSession(req);

    return res.render("forms/infoDataLINK", { formId: form._id });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_submissions_get(req: Request, res: Response, _: NextFunction) {
  try {
    cleanSession(req);
    const auth = res.app.locals.auth;
    const forms = await Form.find({ adminId: auth._id, isSkeleton: false }).sort({ createdAt: -1 });
    if (forms) {
      REDIS_CLIENT.setEx(`${auth._id.toString()}-submissions`, 3600, JSON.stringify(forms));
    }
    return res.render("submissions/infoDataSUBMISSIONS", { submissions: forms });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_submission_get(req: Request, res: Response, _: NextFunction) {
  try {
    const id = req.params.id;
    const adminId = res.app.locals.auth._id;
    const form = await Form.findOne({ _id: id, adminId });
    if (!form) return res.redirect("/");
    return res.render("submissions/infoDataSUBMISSION", { submission: form });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_client_get(req: Request, res: Response, _: NextFunction) {
  try {
    if (req.session.submission) {
      return res.render("submissions/infoDataCLIENT", { form: req.session.submission });
    }
    const { adminId, formId } = req.params;
    let [admin, form] = await Promise.all([
      Admin.findById(adminId),
      Form.findOne({ _id: formId, adminId, isSkeleton: true })
    ]);
    if (!admin || !form) return res.redirect("/");
    return res.render("submissions/infoDataCLIENT", { form });
  } catch (err) {
    console.error(err);
  }
}

export async function info_data_view_get(req: Request, res: Response, _: NextFunction) {
  const id = req.params.id;
  const adminId = res.app.locals.auth._id;
  let form = null;
  try {
    form = await Form.findOne({ _id: id, adminId });
    if (!form) {
      res.redirect("/");
    }

    return res.render("forms/infoDataVIEW", { form });
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
    await REDIS_CLIENT.del(`${admin._id.toString()}-home`);
    return res.status(CREATED).json({ msg: "Form successfully created!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_edit_put(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    const { form } = req.body;
    const admin = await Admin.findOne({ code: form.code });
    if (!admin) {
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
    await REDIS_CLIENT.del(`${admin._id.toString()}-home`);
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

    await REDIS_CLIENT.del(`${admin._id.toString()}-home`);
    return res.status(OK).json({ msg: "Form successfully deleted!" });
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
      text: `${admin.firstName} has sent you a form to fill, you can fill it out using code ${admin.code} at ${PROTOCAL}://${req.headers.host}/client/form-submission/${adminId}/${formId}`
    });

    return res.status(OK).json({ message: "Form link sent successfully!", messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_client_post(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };

  try {
    const { form } = req.body;
    const { title, code } = form;
    const admin = await Admin.findOne({ code });
    if (!admin) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_CODE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const formSkeleton = await Form.findOne({ adminId: admin._id, title, isSkeleton: true });
    if (!formSkeleton) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_DOC_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    delete form.code;
    form.adminId = admin._id;
    const createdForm = await Form.create(form);
    if (!createdForm) {
      return res.status(BAD_REQUEST).json({ hawkError });
    }
    const formId = createdForm._id.toString();
    const { messageId } = await TRANSPORTER.sendMail({
      from: APP_EMAIL,
      to: admin.email,
      subject: `Someone submitted something with your code!`,
      text: `Submission with id: ${formId} has been added to your account. You can view the submission at ${PROTOCAL}://${req.headers.host}/auth/forms/submission/${formId}`
    });
    await REDIS_CLIENT.del(`${admin._id.toString()}-submissions`);
    cleanSession(req);
    return res.status(CREATED).json({ msg: "Submission successful!", messageId });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_submission_delete(req: Request, res: Response, _: NextFunction) {
  const hawkError: IHError = {
    msg: UNKNOWN_ERR_MSG,
    status: BAD_REQUEST,
    src: "InfoDataController"
  };
  try {
    const { code, formId } = req.body;
    const admin = await Admin.findOne({ code });
    if (!admin) {
      hawkError.status = NOT_FOUND;
      hawkError.msg = FORM_EDIT_CODE_ERR;
      return res.status(hawkError.status).json({ hawkError });
    }
    const deletedForm = await Form.findByIdAndDelete(formId);
    if (!deletedForm) {
      return res.status(hawkError.status).json({ hawkError });
    }
    await REDIS_CLIENT.del(`${admin._id.toString()}-submissions`);
    return res.status(OK).json({ msg: "Submission deleted successfully!" });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message) hawkError.msg = err.message;
    }

    return res.status(hawkError.status).json({ hawkError });
  }
}

export async function info_data_session_post(req: Request, res: Response, _: NextFunction) {
  const { submission = {} } = req.body;
  updateSession(req, submission);
  return res.status(OK).json({ msg: "Submission saved!" });
}
