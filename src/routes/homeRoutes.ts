import { NextFunction, Request, Response, Router } from "express";
import { OK } from "../config/keys.error";
import { Form } from "../db/models";
const router: Router = Router();

router.get("/healthcheck", (_: Request, res: Response, __: NextFunction) => {
  return res.status(OK).send({ status: "healthy" });
});

router.get("/", async (_: Request, res: Response, __: NextFunction) => {
  try {
    const auth = res.app.locals.auth;
    let skeletons = null;
    if (auth) {
      skeletons = await Form.find({ isSkeleton: true, adminId: auth._id });
    }
    res.render("home", {
      skeletons
    });
  } catch (err) {
    console.error(err);
  }
});

export default router;
