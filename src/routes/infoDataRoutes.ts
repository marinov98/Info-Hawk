import { Router } from "express";
import { infoDataController } from "../controllers";
const router: Router = Router();

router.get("/infoData", infoDataController.info_data_get);

export default router;
