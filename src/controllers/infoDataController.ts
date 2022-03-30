import { NextFunction, Request, Response } from "express";

export function info_data_create_get(req: Request, res: Response, next: NextFunction) {
  return res.render("infoData/infoDataCREATE");
}

export function info_data_edit_get(req: Request, res: Response, next: NextFunction) {
  return res.render("infoData/infoDataEDIT");
}

export function info_data_view_get(req: Request, res: Response, next: NextFunction) {
  return res.render("infoData/infoDataVIEW");
}
