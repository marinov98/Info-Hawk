import { Router } from "express";
import { adminController } from "./../controllers/index";

const router: Router = Router();

router.get("/register", adminController.register_get);
router.post("/register", adminController.register_post);
router.get("/login", adminController.login_get);
router.post("/login", adminController.login_post);

export default router;
