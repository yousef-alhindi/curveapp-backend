import { Router } from "express";
const router = Router();
import * as auth from '../../controllers/admin/auth'
import { verifyAdminToken } from "../../middlewares/authentication";
import { uploadAdminFile } from '../../utils/aws-s3'

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/uploadFile").post(uploadAdminFile, auth.uploadAdminFile)
router.route("/register").post(auth.createAccount);
router.route("/login").post(auth.login);
router.route("/forgetPassword").post(auth.forgetPassword);
router.route("/verifyOtp").post(verifyAdminToken,auth.verifyOtp);
router.route("/resetPassword").post(verifyAdminToken,auth.resetPassword);
router.route("/profile").get(verifyAdminToken,auth.profile);
router.route("/profile/update").put(verifyAdminToken,auth.updateProfile);
router.route("/profile/changePassword").put(verifyAdminToken,auth.changePassword);


export default router;
