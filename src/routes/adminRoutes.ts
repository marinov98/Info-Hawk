import { Router } from "express";
import { maintainAuth } from "../middleware/authMiddleware";
import { validateInput } from "../middleware/validationMiddleware";
import { adminController } from "./../controllers/index";

const router: Router = Router();

router.get("/register", maintainAuth, adminController.register_get);
router.post("/register", validateInput, adminController.register_post);
router.get("/login", maintainAuth, adminController.login_get);
router.post("/login", validateInput, adminController.login_post);
router.get("/logout", adminController.logout_get);

export default router;
