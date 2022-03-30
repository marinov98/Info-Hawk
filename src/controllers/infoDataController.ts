import { NextFunction, Request, Response } from "express";
export function info_data_get(req: Request, res: Response, next: NextFunction) {
  return res.render("infoData");
}
