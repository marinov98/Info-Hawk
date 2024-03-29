import { Router } from "express";
import { cookieGuard, maintainAuth } from "../middleware/authMiddleware";
import { validateInput } from "../middleware/validationMiddleware";
import { adminController } from "./../controllers/index";

const router: Router = Router();

router.get("/register", maintainAuth, adminController.register_get);
router.post("/register", validateInput, adminController.register_post);
router.get("/login", maintainAuth, adminController.login_get);
router.post("/login", validateInput, adminController.login_post);
router.get("/logout", adminController.logout_get);
router.get("/auth/verify/:token", adminController.verify_email_get);
router.post("/auth/resend", cookieGuard, adminController.home_resend_link_post);
router.delete("/auth/account/delete", cookieGuard, adminController.auth_account_delete);
router.get("/settings", cookieGuard, adminController.settings_get);
router.get("/setting/account", cookieGuard, adminController.deleteAcc_get);

export default router;
