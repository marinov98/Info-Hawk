import { Router } from "express";
import { infoDataController } from "../controllers";
import { cookieGuard } from "../middleware/authMiddleware";
import { cacheSubmissions } from "../middleware/cacheMiddleware";
import {
  ensureVerified,
  validateDeleteVars,
  validateSkeleton,
  validateSubmission
} from "../middleware/infoDataMiddleware";

const router: Router = Router();

router.get(
  "/auth/forms/create",
  cookieGuard,
  ensureVerified,
  infoDataController.info_data_create_get
);
router.post(
  "/auth/forms/create",
  cookieGuard,
  validateSkeleton,
  infoDataController.info_data_create_post
);
router.get("/auth/forms/view/:id", cookieGuard, infoDataController.info_data_view_get);
router.get("/auth/forms/link/:id", cookieGuard, infoDataController.info_data_link_get);
router.post(
  "/auth/forms/link/:adminId/:formId",
  cookieGuard,
  infoDataController.info_data_link_post
);
router.put(
  "/auth/forms/edit",
  cookieGuard,
  validateSkeleton,
  infoDataController.info_data_edit_put
);
router.get("/client/form-submission/:adminId/:formId", infoDataController.info_data_client_get);
router.post(
  "/client/form-submission",
  validateSubmission,
  infoDataController.info_data_client_post
);
router.delete(
  "/auth/forms/delete",
  cookieGuard,
  validateDeleteVars,
  infoDataController.info_data_edit_delete
);
router.get(
  "/auth/forms/submissions",
  cookieGuard,
  ensureVerified,
  cacheSubmissions,
  infoDataController.info_data_submissions_get
);
router.get("/auth/forms/submission/:id", cookieGuard, infoDataController.info_data_submission_get);
router.delete(
  "/auth/forms/submissions/delete",
  cookieGuard,
  infoDataController.info_data_submission_delete
);

export default router;
