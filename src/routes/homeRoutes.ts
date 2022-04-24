import { NextFunction, Request, Response, Router } from "express";
import { REDIS_CLIENT } from "../config/keys.env";
import { OK } from "../config/keys.error";
import { Form } from "../db/models";
import { cacheHome } from "../middleware/cacheMiddleware";
import { cleanSession } from "../utils/session";
const router: Router = Router();

router.get("/healthcheck", (_: Request, res: Response, __: NextFunction) => {
  return res.status(OK).send({ status: "healthy" });
});

router.get("/", cacheHome, async (req: Request, res: Response, __: NextFunction) => {
  try {
    const auth = res.app.locals.auth;
    let skeletons = null;
    if (auth) {
      cleanSession(req);
      skeletons = await Form.find({ isSkeleton: true, adminId: auth._id }).sort({ updatedAt: -1 });
      if (skeletons) {
        REDIS_CLIENT.setEx(`${auth._id.toString()}-home`, 3600, JSON.stringify(skeletons));
      }
    }
    return res.render("home", {
      skeletons
    });
  } catch (err) {
    console.error(err);
  }
});

export default router;
