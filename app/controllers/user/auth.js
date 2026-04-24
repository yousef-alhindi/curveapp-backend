import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { generateJwtToken } from '../../utils/jwt';
import UserModel from '../../models/user/user.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
import { notificationModel } from "../../models/admin/notification.model.js";
import { generateReferralCode } from '../../utils/helper.js';
import { LOYALTY_POINT_MODEL } from '../../models/admin/loyalityPoint.model.js';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/
export const uploadUserFile = async (req, res) => {
   try {
      if (req.files.upload_user_file != undefined || req.files.upload_user_file != null) {
         req.body.upload_user_file = req.files.upload_user_file[0].location
            ? req.files.upload_user_file[0].location
            : '';
      }
      let { upload_user_file } = req.body;
      if (!upload_user_file || upload_user_file == '')
         return { status: 0, message: 'File is required' };
      return sendSuccessResponse(res, upload_user_file, success.UPLOAD_SUCCESS, HttpStatus.OK);
   } catch (error) {
      res.status(403).json({ message: error.message });
   }
};

const generateUniqueReferralCode = async () => {
   let code;
   let exists = true;

   while (exists) {
      code = generateReferralCode();
      exists = await UserModel.exists({ referralCode: code });
   }

   return code;
};


export const createAccount = async (req, res) => {
   try {
      let { countryCode, mobileNumber, deviceToken } = req.body;
      mobileNumber = parseInt(mobileNumber);
      const condition = {
         countryCode: countryCode,
         mobileNumber: mobileNumber,
      };
      const userData = await commonService.findOne(UserModel, condition);

      if (userData) {
         if (userData.isBlocked) {
            return sendErrorResponse(res, 'Your profile has been blocked', HttpStatus.NOT_FOUND);
            return;
         }
         userData.otp = 123456;
         userData.type = 'login';
         // let accessToken = generateJwtToken(userData, "").token
         let accessToken = generateJwtToken(
            {
               countryCode: countryCode,
               mobileNumber: mobileNumber,
               otp: 123456,
               deviceToken: deviceToken,
               type: 'login',
               _id: userData._id,
            },
            '1h'
         ).token;
         sendSuccessResponse(
            res,
            { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber },
            success.OTP_SENT,
            HttpStatus.OK
         );
      } else {
         req.body.otp = 123456;
         req.body.type = 'register';
         const { referralCode } = req.body;
         //let accessToken = generateJwtToken(req.body, '1h').token;
         let accessToken = generateJwtToken({ countryCode, mobileNumber, otp: 123456, type: 'register', referralCode: referralCode }, "24h").token
         const notification = new notificationModel({
            notification_type: 1,
            title: "New User Registration",
            description: mobileNumber
               ? `A new user has started registration with ${countryCode} ${mobileNumber}.`
               : `A new user has started registration with email ${email}.`,
            sendTo: 1,
         });

         await notification.save();
         sendSuccessResponse(
            res,
            { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber, referralCode: referralCode || null },
            success.OTP_SENT,
            HttpStatus.OK
         );
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

// export const verifyOtp = async (req, res) => {
//    try {
//       delete req.tokenData.iat;
//       delete req.tokenData.exp;
//       let tokenData = req.tokenData;
//       console.log('req.tokenData', req.tokenData)
//       let { otp } = req.body;
//       if (otp == tokenData.otp) {
//          if (tokenData.long && tokenData.lat) {
//             tokenData.location = { type: 'Point', coordinates: [tokenData.long, tokenData.lat] };
//          }
//          let result;
//          if (tokenData.type == 'login') {
//             let accessToken = generateJwtToken(tokenData, '24h').token;
//             tokenData.accessToken = accessToken;
//             result = await commonService.findOneAndUpdate(UserModel, tokenData._id, tokenData);
//             if (result.isBlocked) {
//                sendSuccessResponse(res, {}, success.NOT_FOUND, HttpStatus.UNAUTHORIZED);
//                return;
//             }
//          } else if (tokenData.type == 'register') {
//             const condition = {
//                countryCode: tokenData.countryCode,
//                mobileNumber: tokenData.mobileNumber,
//                deviceType: tokenData.deviceType,
//             };
//             const userResp = await commonService.findOne(UserModel, condition);
//             if (!userResp) {
//                let accessToken = generateJwtToken(tokenData, '').token;
//                delete tokenData.type;
//                tokenData.accessToken = accessToken;
//                tokenData.isMobileVerified = true;
//                const createUser = await commonService.create(UserModel, tokenData);
//                result = createUser;
//             } else {
//                result = userResp;
//             }
//          }
//          sendSuccessResponse(res, result, success.OTP_VERIFIED, HttpStatus.OK);
//       } else {
//          return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.BAD_REQUEST);
//       }
//    } catch (error) {
//       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
//    }
// };
export const verifyOtp = async (req, res) => {
   try {
      delete req.tokenData.iat;
      delete req.tokenData.exp;

      const tokenData = req.tokenData;
      const { otp } = req.body;

      // OTP Validation
      if (otp != tokenData.otp) {
         return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.BAD_REQUEST);
      }

      if (Date.now() > tokenData.otpExpiry) {
         return sendErrorResponse(res, "OTP expired", HttpStatus.BAD_REQUEST);
      }

      let result;

      //LOGIN FLOW
      if (tokenData.type === "login") {

         const user = await UserModel.findById(tokenData._id);

         if (!user) {
            return sendErrorResponse(res, "User not found", HttpStatus.NOT_FOUND);
         }

         if (user.isBlocked) {
            return sendErrorResponse(res, "Your profile has been blocked", HttpStatus.UNAUTHORIZED);
         }

         user.deviceToken = tokenData.deviceToken || user.deviceToken;

         const accessToken = generateJwtToken(
            { _id: user._id },
            "24h"
         ).token;

         user.accessToken = accessToken;
         await user.save();

         result = user;
      }

      //  REGISTER FLOW 
      if (tokenData.type === "register") {

         const existingUser = await UserModel.findOne({
            countryCode: tokenData.countryCode,
            mobileNumber: tokenData.mobileNumber,
         });

         if (existingUser) {
            return sendErrorResponse(res, "User already exists", HttpStatus.BAD_REQUEST);
         }

         let referrerUser = null;

         if (tokenData.referralCode) {
            referrerUser = await UserModel.findOne({
               referralCode: tokenData.referralCode,
            });

            if (!referrerUser) {
               return sendErrorResponse(res, "Invalid referral code", HttpStatus.BAD_REQUEST);
            }
         }

         const newReferralCode = await generateUniqueReferralCode();

         // Step 1: Create New User
         let newUser = await UserModel.create({
            countryCode: tokenData.countryCode,
            mobileNumber: tokenData.mobileNumber,
            deviceToken: tokenData.deviceToken,
            isMobileVerified: true,
            referralCode: newReferralCode,
            referredBy: referrerUser ? referrerUser._id : null,
            totalReferralCount: 0,
            loyaltyPoints: 0
         });

         let rewardPoints = 0;

         if (referrerUser) {

            // Step 2: Push into referrer.referredTo
            await UserModel.findByIdAndUpdate(
               referrerUser._id,
               {
                  $addToSet: { referredTo: newUser._id }, // no duplicate
                  $inc: { totalReferralCount: 1 }
               }
            );

            // Step 3: Loyalty Reward
            const loyaltySettings = await LOYALTY_POINT_MODEL.findOne({
               status: 1,
               isDeleted: false
            });

            if (
               loyaltySettings &&
               loyaltySettings.loyaltyWelcomeBonus?.referAndEarn
            ) {
               rewardPoints =
                  loyaltySettings.loyaltyWelcomeBonus.cashbackPoints || 0;

               if (rewardPoints > 0) {
                  await Promise.all([
                     UserModel.findByIdAndUpdate(
                        referrerUser._id,
                        { $inc: { loyaltyPoints: rewardPoints } }
                     ),
                     UserModel.findByIdAndUpdate(
                        newUser._id,
                        { $inc: { loyaltyPoints: rewardPoints } }
                     )
                  ]);
               }
            }
         }

         const accessToken = generateJwtToken( { _id: newUser._id }, "24h").token;
         await UserModel.findByIdAndUpdate(newUser._id, { accessToken });
         const updatedUser = await UserModel.findById(newUser._id);
         result = updatedUser;
      }
      return sendSuccessResponse(res, result, success.OTP_VERIFIED, HttpStatus.OK);

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const resendOtp = async (req, res) => {
   try {
      delete req.tokenData.iat;
      delete req.tokenData.exp;

      req.tokenData.otp = 123456;
      const accessToken = generateJwtToken(req.tokenData, '24h').token;

      if (accessToken) {
         sendSuccessResponse(
            res,
            { accessToken: accessToken, accessToken },
            success.OTP_RESEND,
            HttpStatus.OK
         );
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const completeProfile = async (req, res) => {
   try {
      const id = req.userData._id;
      let { fullName, countryCode, mobileNumber, gender, height, weight, profileImage, dob } = req.body;
      const checkData = await commonService.findById(UserModel, id, {});
      if (!checkData) {
         return sendErrorResponse(res, error.USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      let updateDataToProfile = {
         fullName: fullName,
         countryCode: countryCode,
         mobileNumber: mobileNumber,
         gender: gender,
         height: height,
         weight: weight,
         profileImage: profileImage,
         dob: dob,
         isProfileCompleted: true,
      };
      const updateUserProfile = await commonService.findOneAndUpdate(
         UserModel,
         id,
         updateDataToProfile
      );
      if (updateUserProfile) {
         sendSuccessResponse(res, updateUserProfile, success.USER_PROFILE_UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const logout = async (req, res) => {
   try {
      const id = req.userData._id;
      const checkData = await commonService.findOneAndUpdate(UserModel, id, { accessToken: '' });
      if (!checkData) {
         return sendErrorResponse(res, error.USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      if (checkData) {
         sendSuccessResponse(res, {}, success.Logout, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteUser = async (req, res) => {
   try {
      const id = req.userData._id;
      const { otp } = req.body
      if (otp != req.userData.otp) {
         return sendErrorResponse(res, 'OTP Does not Match', HttpStatus.BAD_REQUEST);
      }
      const checkData = await commonService.findOneAndUpdate(UserModel, id, {
         isDeleted: true,
         isMobileVerified: false,
         isProfileCompleted: false
      });
      if (!checkData) {
         return sendErrorResponse(res, error.USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      if (checkData) {
         sendSuccessResponse(res, {}, success.USER_DELETED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateUserProfile = async (req, res) => {
   try {
      console.log("fskjfhdgljdfilgrtjyh")
      const id = req.userData._id;
      console.log("userData", req.userData);

      let { fullName, countryCode, mobileNumber, gender, height, weight, profileImage, dob } = req.body;
      const checkData = await commonService.findById(UserModel, id, {});
      if (!checkData) {
         return sendErrorResponse(res, error.USER_NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      let updateDataToProfile = {
         fullName: fullName ? fullName : req.userData?.fullName,
         countryCode: countryCode ? countryCode : req.userData?.countryCode,
         mobileNumber: mobileNumber ? mobileNumber : req.userData?.mobileNumber,
         gender: gender ? gender : req.userData?.gender,
         height: height ? height : req.userData?.height,
         weight: weight ? weight : req.userData?.weight,
         dob: dob ? dob : req.userData.dob,
         profileImage: profileImage ? profileImage : req.userData?.profileImage,
      };
      const updateUserProfile = await commonService.findOneAndUpdate(
         UserModel,
         id,
         updateDataToProfile
      );
      if (updateUserProfile) {
         sendSuccessResponse(res, updateUserProfile, 'User profile Updated', HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const socialSignUp = async (req, res) => {
   try {
      let { fullName, socialType, deviceType, deviceToken, uniqueId, profileImage } = req.body;

      if (!socialType || !uniqueId) {
         return sendErrorResponse(res, "socialType and uniqueId are required");
      }

      // Checking user already existing or not 
      let user = await UserModel.findOne({ socialType, uniqueId });

      // Existing User → Login 
      if (user) {
         user.deviceToken = deviceToken || user.deviceToken;
         user.deviceType = deviceType || user.deviceType;
         await user.save();

         let accessToken = generateJwtToken(
            {
               socialType: user.socialType,
               uniqueId: user.uniqueId,
               type: "login",
               _id: user._id,
            },
            "1h"
         ).token;

         return sendSuccessResponse(res, { accessToken, user }, "Login successful", 200);
      }

      // New User → Signup 
      const newUser = await UserModel.create({
         fullName,
         socialType,
         uniqueId,
         profileImage: profileImage || "",
         deviceType,
         deviceToken,
         // isProfileCompleted: true
      });

      let accessToken = generateJwtToken(
         {
            socialType: newUser.socialType,
            uniqueId: newUser.uniqueId,
            type: "register",
            _id: newUser._id,
         },
         "1h"
      ).token;

      return sendSuccessResponse(res, { accessToken, user: newUser }, "Signup successful", 200);

   } catch (error) {
      console.error(error);
      return sendErrorResponse(res, "Something went wrong", error);
   }
};

