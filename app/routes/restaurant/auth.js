import { Router } from "express";
import * as auth from '../../controllers/restaurant/auth';
import { uploadRestaurantFile } from '../../utils/aws-s3';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 1 ****************
*****************************************/

router.route("/uploadFile").post(uploadRestaurantFile, auth.uploadResFile);

router.route("/create")
    .post(auth.createAccount)
    // .patch(verifyUserToken,auth.completeProfile)

router.route("/otp")
    .post(verifyRestaurantToken, auth.verifyOtp)
    .get(verifyRestaurantToken,auth.resendOtp);

router.route('/createBussinessProfile').put(verifyRestaurantToken, auth.bussinessProfile);
router.route('/bussinessOtp').post(verifyRestaurantToken, auth.verifyBussinessOtp);
router.route('/addResLocation').put(verifyRestaurantToken, auth.addResLocation);
router.route('/addResDocuments').put(verifyRestaurantToken, auth.uploadDocuments);
router.route('/addBankDetails').put(verifyRestaurantToken, auth.addBankDetails);

router.route('/resCategory').get( verifyRestaurantToken, auth.resCategoryList);
router.route('/updateDeliveryStatus').post( verifyRestaurantToken, auth.updateDeliveryStatus);
router.route('/logout').post( verifyRestaurantToken, auth.restlogout);
router.route('/updateProfile').post( verifyRestaurantToken, auth.profileUpdated);




export default router;
