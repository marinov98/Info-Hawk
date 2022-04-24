import { NextFunction, Request, Response } from "express";
import { REDIS_CLIENT } from "../config/keys.env";
import { BAD_REQUEST, OK } from "../config/keys.error";
import { Form } from "../db/models";

export async function filter_get(req: Request, res: Response, next: NextFunction) {
  const adminId = res.app.locals.auth._id;
  const uniqueTitles = await Form.distinct("title", { isSkeleton: false, adminId });

  return res.render("submissions/infoDataFILTER", { uniqueTitles });
}

export async function filter_find(req: Request, res: Response, next: NextFunction) {
  const { title } = req.body;
  const adminId = res.app.locals.auth._id;
  return await Form.find({ title, adminId, isSkeleton: false });
}

export async function filter_delete(req: Request, res: Response, next: NextFunction) {
  const { title } = req.body;
  const adminId = res.app.locals.auth._id;
  const result = await Form.deleteMany({ title, adminId, isSkeleton: false });
  if (!result) {
    return res.status(BAD_REQUEST);
  }
  await REDIS_CLIENT.del(`${adminId.toString()}-submissions`);
  return res.status(OK).json({ msg: `Submissions with title: "${title}" successfully deleted` });
}

export async function toXmlSingle_post(req: Request, res: Response, next: NextFunction) {
  const { jsonStr = "{}" } = req.body;
  let target_json = JSON.parse(jsonStr);

  // remove unecessary values
  delete target_json["__v"];
  delete target_json["isSkeleton"];
  delete target_json["updatedAt"];
  target_json["createdAt"] = new Date(target_json["createdAt"]).toDateString();

  // format accordingly
  let formattedDataStore: any = {};
  Object.entries(target_json).forEach(([key, val]) => {
    const decryptedVal = val as any;
    const decryptedKey: any = key.split("_^_").join(" ");
    if (decryptedVal.input) {
      formattedDataStore[decryptedKey] = decryptedVal.input;
    } else {
      formattedDataStore[decryptedKey] = decryptedVal;
    }
  });

  return res.status(OK).json({ output: [formattedDataStore] });
}

export async function toXmlMultiple_post(req: Request, res: Response, next: NextFunction) {
  const { title } = req.body;
  const adminId = res.app.locals.auth._id;
  const submissions = (await Form.find({ title, adminId, isSkeleton: false })) as any;
  if (!submissions) {
    return res.status(BAD_REQUEST).json({
      hawkError: {
        src: "FilterController",
        msg: "could not find submissions with this title!",
        status: BAD_REQUEST
      }
    });
  }

  const output: any[] = [];
  submissions.forEach((submission: any) => {
    const formattedSubmission: any = {};
    const currSubmission = { ...submission._doc };

    // remove unecessary values
    delete currSubmission["__v"];
    delete currSubmission["isSkeleton"];
    delete currSubmission["updatedAt"];

    // make ids into strings
    currSubmission["_id"] = currSubmission["_id"].toString();
    currSubmission["adminId"] = currSubmission["adminId"].toString();
    currSubmission["createdAt"] = new Date(submission["createdAt"]).toDateString();

    Object.entries(currSubmission).forEach(([key, val]) => {
      const decryptedVal = val as any;
      const decryptedKey: any = key.split("_^_").join(" ");
      if (decryptedVal.input) {
        formattedSubmission[decryptedKey] = decryptedVal.input;
      } else {
        formattedSubmission[decryptedKey] = decryptedVal;
      }
    });
    output.push(formattedSubmission);
  });
  return res.status(OK).json({ output });
}
