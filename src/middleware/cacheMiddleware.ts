import { NextFunction, Request, Response } from "express";
import { REDIS_CLIENT } from "../config/keys.env";

export async function cacheHome(req: Request, res: Response, next: NextFunction) {
  const auth = res.app.locals.auth;
  if (auth) {
    const key = `${auth._id.toString()}-home`;
    const data = await REDIS_CLIENT.get(key);
    if (data !== null) {
      return res.render("home", { skeletons: JSON.parse(data) });
    } else {
      next();
    }
  } else {
    next();
  }
}

export async function cacheSubmissions(req: Request, res: Response, next: NextFunction) {
  const auth = res.app.locals.auth;
  const key = `${auth._id.toString()}-submissions`;
  const data = await REDIS_CLIENT.get(key);
  if (data !== null) {
    return res.render("submissions/infoDataSUBMISSIONS", { submissions: JSON.parse(data) });
  } else {
    next();
  }
}
