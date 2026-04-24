import { Router } from "express";
const router = Router();
import * as auth from '../../controllers/delivery/auth'
import { verifyDeliveryToken } from "../../middlewares/authentication";
import { uploadDeliveryFile } from '../../utils/aws-s3'

/****************************************
*************** SPRINT 2 ****************
*****************************************/
router.route("/uploadFile").post(uploadDeliveryFile, auth.uploadDeliveryFile)
router.route("/register").post(auth.createAccount);
router.route("/login").post(auth.login);
router.route("/addBank").post(verifyDeliveryToken, auth.addBankDetails);
router.route("/addVechile").post(verifyDeliveryToken, auth.addVechileDetails);
router.route("/resetPassword").post(auth.resetPassword);
router.route("/newPassword").post(verifyDeliveryToken, auth.generateNewPassword);
router.route("/verifyOtp").post(verifyDeliveryToken, auth.verifyOtp);
router.route("/updatePassword").post(verifyDeliveryToken, auth.changePassword);
router.route("/updateDoc").put(verifyDeliveryToken, auth.driverDocumentUpdate);
router.route("/updateDeliveryStatus").patch(verifyDeliveryToken, auth.updateDeliveryStatus);
router.route("/deliveryBoyDetails").get(verifyDeliveryToken, auth.deliveryBoyDetails);
router.route("/updateDeliveryBoyDetails").patch(verifyDeliveryToken, auth.updateDeliveryBoyDetails);
router.route('/logout').post(verifyDeliveryToken, auth.driverLogout);

router.route("/deleteDeliveryBoy").get(verifyDeliveryToken, auth.deleteAccount);

router.route("/updateProfile").put(verifyDeliveryToken, auth.updateDriverProfile);

export default router;
