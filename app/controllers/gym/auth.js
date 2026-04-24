import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { generateJwtToken } from '../../utils/jwt';
import * as commonService from '../../services/common/common.service';
import { GymModel } from '../../models/gym/gym.model';
import { notificationModel } from "../../models/admin/notification.model.js"

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/

export const uploadGymFile = async (req, res) => {
   try {
      if (
         req.files.upload_gym_file != undefined ||
         req.files.upload_gym_file != null
      ) {
         req.body.upload_gym_file = req.files.upload_gym_file[0].location
            ? req.files.upload_gym_file[0].location
            : '';
      }
      let { upload_gym_file } = req.body;
      if (!upload_gym_file || upload_gym_file == '')
         return { status: 0, message: 'File is required' };
      return sendSuccessResponse(
         res,
         upload_gym_file,
         success.UPLOAD_SUCCESS,
         HttpStatus.OK
      );
   } catch (error) {
      res.status(403).json({ message: error.message });
   }
};

export const createAccount = async (req, res) => {
   try {
      let { countryCode, mobileNumber, deviceToken, deviceType, email } = req.body;
      mobileNumber = parseInt(mobileNumber);
      let userData;
      if (email) {
         const lowerCaseEmail = email.toLowerCase();
         const condition = { email: lowerCaseEmail };
         userData = await commonService.findOne( GymModel, condition);

      } else {
         const condition = {
            countryCode: countryCode,
            mobileNumber: mobileNumber,
         };
         userData = await commonService.findOne(GymModel, condition);
      }

      if (userData) {
         if (userData?.isBlocked) {
            return res.status(403).json({ auth: false, message: "Your account has been blocked by the admin" });
         }

         userData.otp = 123456;
         userData.type = 'login';
         if (mobileNumber) {
            let accessToken = generateJwtToken(
               {
                  countryCode: countryCode,
                  mobileNumber: mobileNumber,
                  otp: 123456,
                  deviceToken: deviceToken,
                  deviceType: deviceType,
                  type: 'login',
                  _id: userData._id
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
            let accessToken = generateJwtToken(
               {
                  email: email,
                  otp: 123456,
                  deviceToken: deviceToken,
                  deviceType: deviceType,
                  type: 'login',
                  _id: userData._id
               },
               '1h'
            ).token;
            sendSuccessResponse(
               res,
               { accessToken: accessToken, email: email },
               success.OTP_SENT,
               HttpStatus.OK
            );
         }
      } else {
         if (mobileNumber) {

            req.body.otp = 123456;
            req.body.type = 'register';
            req.body.SignUpByPhone = true
            let accessToken = generateJwtToken(req.body, '1h').token;
            sendSuccessResponse(
               res,
               { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber },
               success.OTP_SENT,
               HttpStatus.OK
            );
         }
         else {
            req.body.otp = 123456;
            req.body.type = 'register';
            req.body.SignUpByEmail = true
            let accessToken = generateJwtToken(req.body, '1h').token;
            sendSuccessResponse(
               res,
               { accessToken: accessToken, email: email },
               success.OTP_SENT,
               HttpStatus.OK
            );
         }
      }
      const notification = new notificationModel({
            notification_type: 1,
            title: "New gym Store Registration",
            description: mobileNumber
               ? `A new gym store has started registration with ${countryCode} ${mobileNumber}.`
               : `A new gym store has started registration with email ${email}.`,
            sendTo: 1,
         });

         await notification.save();

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const verifyOtp = async (req, res) => {
   try {
      delete req.tokenData.iat;
      delete req.tokenData.exp;
      let tokenData = req.tokenData;
      let { otp } = req.body;
      if (otp == tokenData.otp) {
         if (tokenData.long && tokenData.lat) {
            tokenData.location = { type: 'Point', coordinates: [tokenData.long, tokenData.lat] };
         }
         let result;
         if (tokenData.type == 'login') {
            let accessToken = generateJwtToken(tokenData, '24h').token;
            tokenData.accessToken = accessToken;
            result = await commonService.findOneAndUpdate(
               GymModel,
               tokenData._id,
               tokenData
            );
            if (result.gymStatus === 0) {
               return sendSuccessResponse(
               res,
               result,
               "Your profile is under review. Please wait!",
               HttpStatus.OK
               );
            } else if (result.gymStatus === 2) {
               if(result.rejected_reason.rejectedBy === "Fully Rejected"){
                  return sendErrorResponse(
                     res,
                     "Your profile is Fully Rejected",
                     HttpStatus.UNAUTHORIZED
                     );
               }
               result = await commonService.findOneAndUpdate(
                  GymModel,
                  tokenData._id,
                  tokenData
               );
               return sendSuccessResponse(
                  res,
                  result,
                  "Your Documents has been rejected.",
                  HttpStatus.OK
                  );
            }
         } else if (tokenData.type == 'register') {
            const condition = {
               countryCode: tokenData.countryCode,
               mobileNumber: tokenData.mobileNumber,
               deviceType: tokenData.deviceType,
            };
            const userResp = await commonService.findOne(GymModel, condition);
            if (!userResp) {
               let accessToken = generateJwtToken(tokenData, '').token;
               delete tokenData.type;
               tokenData.accessToken = accessToken;
               tokenData.isMobileVerified = true;
               // const createUser = await commonService.create(GymModel, tokenData);
               const createUser = await new GymModel(tokenData).save();
               result = createUser;
            } else {
               result = userResp;
            }
         }
         sendSuccessResponse(res, result, success.OTP_VERIFIED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.BAD_REQUEST);
      }
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
         // await commonService.findOneAndUpdate(GymModel, )
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

export const bussinessProfile = async (req, res) => {
   try {
      const gym = req?.gymData;
      let data = req.body;
      const findRes = await commonService.findOne(GymModel, { _id: gym?._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const updateRes = await commonService.findOneAndUpdate(GymModel, findRes?._id, {
         ...data,
         otp: 123456,
      });
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const verifyBussinessOtp = async (req, res) => {
   try {
      const gym = req.gymData;
      const { otp } = req.body;

      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      if (otp === findRes.otp) {
         return sendSuccessResponse(res, findRes, success.OTP_VERIFIED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.NOT_FOUND);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const addGymLocation = async (req, res) => {
   try {
      const gym = req.gymData;
      let { lat, long, address, street, building, postalCode, gymLogo } = req.body;
      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         location: {
            type: 'Point',
            coordinates: [long, lat],
         },
         addressDetails: {
            address: address,
            street: street,
            building: building,
            postalCode: postalCode,
            gymLogo: gymLogo,
         },
         isLocationDetails: true,
      };
      const updateRes = await commonService.findOneAndUpdate(GymModel, findRes._id, data);
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const uploadDocuments = async (req, res) => {
   try {
      const gym = req.gymData;
      let { license, idProof, workingDays, openingTime, closingTime } = req.body;

      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         documents: {
            license: license,
            idProof: idProof,
            workingDays: workingDays,
            openingTime: openingTime,
            closingTime: closingTime,
         },
         isDocumentsUploaded: true,
         gymStatus: 0,
         rejected_reason:{
            reason: "",
            rejectedBy:""
         }
      };
      const updateRes = await commonService.findOneAndUpdate(GymModel, findRes._id, data);
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const addBankDetails = async (req, res) => {
   try {
      const gym = req.gymData;
      let { bankAccountNo, accHolderName, bankCode, bankName } = req.body;

      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         bankDetails: {
            bankAccountNo: bankAccountNo,
            accHolderName: accHolderName,
            bankCode: bankCode,
            bankName: bankName,
         },
         isBankDetailsUpdated: true,
         profileCompletion: 1,
         gymStatus: 0

      };
      const updateRes = await commonService.findOneAndUpdate(GymModel, findRes._id, data);
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDeliveryStatus = async (req, res) => {
   try {
      let gym = req.gymData;
      let { type, status } = req.body;
      let data = {};
      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      if (type === 1) {
         data = {
            isDelivery: status,
         };
      } else {
         data = {
            isTakeAway: status,
         };
      }
      const update = await commonService.findOneAndUpdate(GymModel, findRes._id, data);
      if (update) {
         return sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const gymLogout = async (req, res) => {
   try {
      const id = req.gymData;
      const checkData = await commonService.findOneAndUpdate(GymModel, id._id, {
         accessToken: '',
      });
      if (!checkData) {
         return sendErrorResponse(res, "Gym Not Found", HttpStatus.BAD_REQUEST);
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

export const profileUpdated = async (req, res) => {
   try {
      let {
         colorCode,
         name,
         ownerName,
         address,
         license,
         workingDays,
         openingTime,
         closingTime,
         idProof,
         bankAccountNo,
         accHolderName,
         bankCode,
         bankName,
         gymLogo,
         profileImage,
         location,
         gymType
      } = req.body;

      const gym = req.gymData;

      const findRes = await commonService.findOne(GymModel, { _id: gym._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      findRes.colorCode = colorCode ? colorCode : findRes.colorCode ;
      findRes.name = name ? name :  findRes.name
      findRes.ownerName = ownerName ? ownerName :findRes.ownerName
      findRes.addressDetails.address = address ? address : findRes.addressDetails.address
      findRes.addressDetails.gymLogo = gymLogo ? gymLogo : findRes.addressDetails.gymLogo
      findRes.bankDetails.bankAccountNo = bankAccountNo ? bankAccountNo : findRes.bankDetails.bankAccountNo
      findRes.bankDetails.accHolderName = accHolderName ? accHolderName : findRes.bankDetails.accHolderName
      findRes.bankDetails.bankCode = bankCode ? bankCode : findRes.bankDetails.bankCode
      findRes.bankDetails.bankName = bankName ? bankName : findRes.bankDetails.bankName
      findRes.documents.license = license ? license :  findRes.documents.license
      findRes.documents.idProof = idProof ? idProof :  findRes.documents.idProof
      findRes.documents.workingDays = workingDays ? workingDays :  findRes.documents.workingDays
      findRes.documents.openingTime = openingTime ? openingTime :  findRes.documents.openingTime
      findRes.documents.closingTime = closingTime ? closingTime :  findRes.documents.closingTime
      findRes.profileImage = profileImage ? profileImage :  findRes.profileImage
      findRes.location = location ? location :  findRes.location 
      findRes.gymType = gymType ? gymType :  findRes.gymType 

      const update = await commonService.findOneAndUpdate(GymModel, findRes._id, findRes);
      if (update) {
         sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};