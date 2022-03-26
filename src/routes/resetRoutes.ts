import { Router } from "express";
import { maintainAuth } from "../middleware/authMiddleware";
import { validateInput } from "../middleware/validationMiddleware";
import { resetController } from "./../controllers/index";
const router: Router = Router();

router.get("/error/token", maintainAuth, resetController.token_expire_get);
router.get("/passwordMail", maintainAuth, resetController.reset_password_mail_get);
router.post("/passwordMail", validateInput, resetController.reset_password_mail_post);
router.get("/passwordReset/:token", maintainAuth, resetController.reset_password_form_get);
router.put("/reset/:token", validateInput, resetController.reset_password_form_put);

export default router;
