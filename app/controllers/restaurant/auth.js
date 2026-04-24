import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { generateJwtToken } from '../../utils/jwt';
import * as commonService from '../../services/common/common.service';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { RestaurantCategoryModel } from '../../models/admin/restaurantCategory.model';
import { notificationModel } from "../../models/admin/notification.model.js"

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const uploadResFile = async (req, res) => {
   try {
      if (
         req.files.upload_restaurant_file != undefined ||
         req.files.upload_restaurant_file != null
      ) {
         req.body.upload_restaurant_file = req.files.upload_restaurant_file[0].location
            ? req.files.upload_restaurant_file[0].location
            : '';
      }
      let { upload_restaurant_file } = req.body;
      if (!upload_restaurant_file || upload_restaurant_file == '')
         return { status: 0, message: 'File is required' };
      return sendSuccessResponse(
         res,
         upload_restaurant_file,
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
         userData = await commonService.findOne(RestaurantModel, condition);

      } else {
         const condition = {
            countryCode: countryCode,
            mobileNumber: mobileNumber,
         };
         userData = await commonService.findOne(RestaurantModel, condition);
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
      if (!userData) {
         const isPhoneSignup = !!mobileNumber;
         const notification = new notificationModel({
            notification_type: 1,
            title: "New restaurant account registration",
            description: isPhoneSignup
               ? `A new restaurant has started registration with ${countryCode} ${mobileNumber}.`
               : `A new restaurant has started registration with email ${email}.`,
            sendTo: 1,
         });
         await notification.save();
      }

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
               RestaurantModel,
               tokenData._id,
               tokenData
            );
         } else if (tokenData.type == 'register') {
            const condition = {
               countryCode: tokenData.countryCode,
               mobileNumber: tokenData.mobileNumber,
               deviceType: tokenData.deviceType,
            };
            const userResp = await commonService.findOne(RestaurantModel, condition);
            if (!userResp) {
               let accessToken = generateJwtToken(tokenData, '').token;
               delete tokenData.type;
               tokenData.accessToken = accessToken;
               tokenData.isMobileVerified = true;
               // const createUser = await commonService.create(RestaurantModel, tokenData);
               const createUser = await new RestaurantModel(tokenData).save();
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
         // await commonService.findOneAndUpdate(RestaurantModel, )
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
      const rest = req?.restaurantData;
      let data = req.body;
      const findRes = await commonService.findOne(RestaurantModel, { _id: rest?._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const updateRes = await commonService.findOneAndUpdate(RestaurantModel, findRes?._id, {
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
      const rest = req.restaurantData;
      const { otp } = req.body;

      const findRes = await commonService.findOne(RestaurantModel, { _id: rest._id });
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

export const addResLocation = async (req, res) => {
   try {
      const rest = req.restaurantData;
      let { lat, long, address, street, building, postalCode, resLogo } = req.body;
      const findRes = await commonService.findOne(RestaurantModel, { _id: rest._id });
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
            resLogo: resLogo,
         },
         isLocationDetails: true,
      };
      const updateRes = await commonService.findOneAndUpdate(RestaurantModel, findRes._id, data);
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
      const rest = req.restaurantData;
      let { license, idProof, workingDays, openingTime, closingTime } = req.body;

      const findRes = await commonService.findOne(RestaurantModel, { _id: rest._id });
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
      };
      const updateRes = await commonService.findOneAndUpdate(RestaurantModel, findRes._id, data);
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
      const rest = req.restaurantData;
      let { bankAccountNo, accHolderName, bankCode, bankName } = req.body;

      const findRes = await commonService.findOne(RestaurantModel, { _id: rest._id });
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
         restaurantStatus: 0

      };
      const updateRes = await commonService.findOneAndUpdate(RestaurantModel, findRes._id, data);
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const resCategoryList = async (req, res) => {
   try {
      const resCategoryData = await commonService.getAll(RestaurantCategoryModel, { isDeleted: false });
      if (resCategoryData) {
         return sendSuccessResponse(res, resCategoryData, success.LIST_FETCH, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDeliveryStatus = async (req, res) => {
   try {
      let resData = req.restaurantData;
      let { type, status } = req.body;
      let data = {};
      const findRes = await commonService.findOne(RestaurantModel, { _id: resData._id });
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
      const update = await commonService.findOneAndUpdate(RestaurantModel, findRes._id, data);
      if (update) {
         return sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const restlogout = async (req, res) => {
   try {
      const id = req.restaurantData;
      const checkData = await commonService.findOneAndUpdate(RestaurantModel, id._id, {
         accessToken: '',
      });
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

export const profileUpdated = async (req, res) => {
   try {
      let {
         colorCode,
         resName,
         ownerName,
         resCategory,
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
         resLogo,
         profileImage,
         location
      } = req.body;
      const resData = req.restaurantData;
      const findRes = await commonService.findOne(RestaurantModel, { _id: resData._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      let data = {
         colorCode: colorCode,
         resName: resName,
         ownerName: ownerName,
         resCategory: resCategory,
         addressDetails: {
            address: address,
            resLogo: resLogo,
         },
         bankDetails: {
            bankAccountNo: bankAccountNo,
            accHolderName: accHolderName,
            bankCode: bankCode,
            bankName: bankName,
         },
         documents: {
            license: license,
            idProof: idProof,
            workingDays: workingDays,
            openingTime: openingTime,
            closingTime: closingTime,
         },
         profileImage: profileImage,
         location: location,
         address: address
      };

      const update = await commonService.findOneAndUpdate(RestaurantModel, findRes._id, data);
      if (update) {
         const notification = new notificationModel({
            notification_type: 2,
            title: "Restaurant profile updated",
            description: `${update.resName || "A restaurant"} has updated their profile.`,
            sendTo: 1,
         });
         await notification.save();

         sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.UNABLE_TO_UPDATE, HttpStatus.EXPECTATION_FAILED);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};