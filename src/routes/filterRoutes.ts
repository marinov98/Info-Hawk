import { Router } from "express";
import * as filterController from "../controllers/filterController";
import { cookieGuard } from "../middleware/authMiddleware";
import { ensureVerified } from "../middleware/infoDataMiddleware";

const router: Router = Router();

router.get("/auth/forms/filter", cookieGuard, ensureVerified, filterController.filter_get);

router.delete(
  "/auth/forms/filter_delete",
  cookieGuard,
  ensureVerified,
  filterController.filter_delete
);

router.post(
  "/auth/forms/xml/single",
  cookieGuard,
  ensureVerified,
  filterController.toXmlSingle_post
);

router.post(
  "/auth/forms/xml/multiple",
  cookieGuard,
  ensureVerified,
  filterController.toXmlMultiple_post
);

export default router;
