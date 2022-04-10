import { Router } from "express";
import { infoDataController } from "../controllers";
import { authenticateAdmin } from "../middleware/authMiddleware";
import {
  ensureVerified,
  validateDeleteVars,
  validateSkeleton,
  validateSubmission
} from "../middleware/infoDataMiddleware";

const router: Router = Router();

router.get(
  "/auth/forms/create",
  authenticateAdmin,
  ensureVerified,
  infoDataController.info_data_create_get
);
router.post(
  "/auth/forms/create",
  authenticateAdmin,
  validateSkeleton,
  infoDataController.info_data_create_post
);
router.get("/auth/forms/view/:id", authenticateAdmin, infoDataController.info_data_view_get);
router.get("/auth/forms/link/:id", authenticateAdmin, infoDataController.info_data_link_get);
router.post(
  "/auth/forms/link/:adminId/:formId",
  authenticateAdmin,
  infoDataController.info_data_link_post
);
router.post(
  "/auth/forms/edit",
  authenticateAdmin,
  validateSkeleton,
  infoDataController.info_data_edit_post
);
router.get("/client/form-submission/:adminId/:formId", infoDataController.info_data_client_get);
router.post(
  "/client/form-submission",
  validateSubmission,
  infoDataController.info_data_client_post
);
router.delete(
  "/auth/forms/delete",
  authenticateAdmin,
  validateDeleteVars,
  infoDataController.info_data_edit_delete
);
router.get(
  "/auth/forms/submissions",
  authenticateAdmin,
  ensureVerified,
  infoDataController.info_data_submissions_get
);
router.get(
  "/auth/forms/submission/:id",
  authenticateAdmin,
  infoDataController.info_data_submission_get
);
router.delete(
  "/auth/forms/submissions/delete",
  authenticateAdmin,
  infoDataController.info_data_submission_delete
);

export default router;
