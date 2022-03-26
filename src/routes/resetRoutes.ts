import { Router } from "express";
import { resetController } from "./../controllers/index";
const router: Router = Router();

router.get("/tokenExpire", resetController.token_expire_get);
router.get("/passwordMail", resetController.reset_password_mail_get);
router.post("/passwordMail", resetController.reset_password_mail_post);
router.get("/passwordReset/:token", resetController.reset_password_form_get);
router.put("/reset/:token", resetController.reset_password_form_put);

export default router;
