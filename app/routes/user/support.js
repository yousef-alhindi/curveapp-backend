import { Router } from "express";
import * as support from "../../controllers/user/support.js"
import { verifyUserToken } from "../../middlewares/authentication.js";

const router = Router();


router.route("/").post(verifyUserToken, support.userSupport);
router.route("/getSupport").get(verifyUserToken, support.userSupportList)


export default router;
