import { Router } from 'express';
import * as auth from '../../controllers/user/auth';
import { verifyUserToken, verifyUserTokenForDelete, optionalVerifyUserToken } from '../../middlewares/authentication';
import { uploadUserFile } from '../../utils/aws-s3';

const router = Router();

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

router.route('/uploadFile').post(uploadUserFile, auth.uploadUserFile);

router.route('/users').post(auth.createAccount).patch(verifyUserToken, auth.completeProfile);

router
   .route('/users/otp')
   .post(verifyUserToken, auth.verifyOtp)
   .get(verifyUserToken, auth.resendOtp);
//this route include social media
//router.route('/profileComplete').patch(verifyUserToken,optionalVerifyUserToken, auth.completeProfile);
router.route('/profileComplete').patch(verifyUserToken, auth.completeProfile)

router.route('/logout').post(verifyUserToken, auth.logout);
router.route('/deleteUser').post(verifyUserTokenForDelete, auth.deleteUser);
router.route('/updateUser').post(optionalVerifyUserToken,verifyUserToken, auth.updateUserProfile);
router.route('/socialSignup').post(auth.socialSignUp)

export default router;
