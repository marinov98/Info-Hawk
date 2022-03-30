import { Router } from "express";
import { infoDataController } from "../controllers";
const router: Router = Router();

router.get("/auth/forms/create", infoDataController.info_data_create_get);
router.get("/auth/forms/edit", infoDataController.info_data_edit_get);
router.get("/auth/forms/view", infoDataController.info_data_view_get);

export default router;
