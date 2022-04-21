import { Router } from "express";
import * as filterController from "../controllers/filterController";
import { authenticateAdmin } from "../middleware/authMiddleware";
import { ensureVerified } from "../middleware/infoDataMiddleware";

const router: Router = Router();

router.get("/auth/forms/filter", authenticateAdmin, ensureVerified, filterController.filter_get);

router.delete(
  "/auth/forms/filter_delete",
  authenticateAdmin,
  ensureVerified,
  filterController.filter_delete
);

router.post(
  "/auth/forms/xml/single",
  authenticateAdmin,
  ensureVerified,
  filterController.toXmlSingle_post
);

router.post(
  "/auth/forms/xml/multiple",
  authenticateAdmin,
  ensureVerified,
  filterController.toXmlMultiple_post
);

export default router;
