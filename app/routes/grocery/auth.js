import { Router } from "express";
import * as auth from '../../controllers/grocery/auth';
import { uploadGroceryFile } from '../../utils/aws-s3';
import { verifyGroceryToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/uploadFile").post(uploadGroceryFile, auth.uploadResFile);

router.route("/create")
    .post(auth.createAccount)
    // .patch(verifyUserToken,auth.completeProfile)

router.route("/otp")
    .post(verifyGroceryToken, auth.verifyOtp)
    .get(verifyGroceryToken,auth.resendOtp);

router.route('/createBussinessProfile').put(verifyGroceryToken, auth.bussinessProfile);
router.route('/bussinessOtp').post(verifyGroceryToken, auth.verifyBussinessOtp);
router.route('/addGroceryLocation').put(verifyGroceryToken, auth.addResLocation);
router.route('/addGroceryDocuments').put(verifyGroceryToken, auth.uploadDocuments);
router.route('/addBankDetails').put(verifyGroceryToken, auth.addBankDetails);
// router.route('/resCategory').get( verifyGroceryToken, auth.resCategoryList);
router.route('/updateDeliveryStatus').post( verifyGroceryToken, auth.updateDeliveryStatus);
router.route('/logout').post( verifyGroceryToken, auth.grocerylogout);
router.route('/updateProfile').post( verifyGroceryToken, auth.profileUpdated);




export default router;
