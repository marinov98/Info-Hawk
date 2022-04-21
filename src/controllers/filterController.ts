import { NextFunction, Request, Response } from "express";
import { OK } from "../config/keys.error";
import { Form } from "../db/models";

export async function filter_get(req: Request, res: Response, next: NextFunction) {
  const adminId = res.app.locals.auth._id;
  const uniqueTitles = await Form.distinct("title", { isSkeleton: false, adminId });

  return res.render("infoDataFILTER", { uniqueTitles });
}

export async function filter_find(req: Request, res: Response, next: NextFunction) {
  // TODO: get all submissions (isSkeleton: true, logged in adminId) based on title
}

export async function filter_delete(req: Request, res: Response, next: NextFunction) {
  // TODO: delete all submissions with title specified and logged in adminID
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
  Object.entries(target_json).forEach(
    ([key, val]) => (formattedDataStore[key.split("_^_").join(" ")] = val)
  );

  return res.status(OK).json({ output: [formattedDataStore] });
}

export async function toXmlMultiple_post(req: Request, res: Response, next: NextFunction) {}
