import { Router } from "express";
import * as auth from '../../controllers/gym/auth';
import { uploadGymFile } from '../../utils/aws-s3';
import { verifyGymToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route("/uploadFile").post(uploadGymFile, auth.uploadGymFile);

router.route("/create").post(auth.createAccount)

router.route("/otp")
    .post(verifyGymToken, auth.verifyOtp)
    .get(verifyGymToken,auth.resendOtp);

router.route('/createBussinessProfile').put(verifyGymToken, auth.bussinessProfile);
router.route('/bussinessOtp').post(verifyGymToken, auth.verifyBussinessOtp);
router.route('/addGymLocation').put(verifyGymToken, auth.addGymLocation);
router.route('/addGymDocuments').put(verifyGymToken, auth.uploadDocuments);
router.route('/addBankDetails').put(verifyGymToken, auth.addBankDetails);
router.route('/logout').post( verifyGymToken, auth.gymLogout);
router.route('/updateProfile').post( verifyGymToken, auth.profileUpdated);




export default router;
