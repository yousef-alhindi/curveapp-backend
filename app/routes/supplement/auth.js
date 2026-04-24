import { Router } from "express";
import * as auth from '../../controllers/supplement/auth';
import { uploadSupplementFile } from '../../utils/aws-s3';
import { verifySupplementToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 6 ****************
*****************************************/

router.route("/uploadFile").post(uploadSupplementFile, auth.uploadSupFile);

router.route("/create")
    .post(auth.createAccount)

router.route("/otp")
    .post(verifySupplementToken, auth.verifyOtp)
    .get(verifySupplementToken,auth.resendOtp);

router.route('/createBussinessProfile').put(verifySupplementToken, auth.bussinessProfile);
router.route('/bussinessOtp').post(verifySupplementToken, auth.verifyBussinessOtp);
router.route('/addSupLocation').put(verifySupplementToken, auth.addSupLocation);
router.route('/addSupDocuments').put(verifySupplementToken, auth.uploadDocuments);
router.route('/addBankDetails').put(verifySupplementToken, auth.addBankDetails);
router.route('/logout').post( verifySupplementToken, auth.supplementLogout);
router.route('/updateProfile').post( verifySupplementToken, auth.profileUpdated);




export default router;
