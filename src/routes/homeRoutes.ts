import { NextFunction, Request, Response, Router } from "express";
import { GOOD } from "../config/keys.error";
const router: Router = Router();

router.get("/healthcheck", (_: Request, res: Response, __: NextFunction) => {
  return res.status(GOOD).send({ status: "healthy" });
});

router.get("/", (_: Request, res: Response, __: NextFunction) => res.render("home"));

export default router;
