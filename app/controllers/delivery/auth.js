import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { generateJwtToken } from '../../utils/jwt';
import * as commonService from '../../services/common/common.service';
import { Delivery_Model } from '../../models/delivery/delivery.model';
import { comparePassword, generatePassword } from '../../utils/password';
const mongoose = require('mongoose'); // mongoose database
import { notificationModel } from "../../models/admin/notification.model.js"


/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

export const uploadDeliveryFile = async (req, res) => {
   try {
      if (req.files.upload_delivery_file != undefined || req.files.upload_delivery_file != null) {
         req.body.upload_delivery_file = req.files.upload_delivery_file[0].location
            ? req.files.upload_delivery_file[0].location
            : '';
      }
      let { upload_delivery_file } = req.body;
      if (!upload_delivery_file || upload_delivery_file == '')
         return { status: 0, message: 'File is required' };
      return sendSuccessResponse(res, upload_delivery_file, success.UPLOAD_SUCCESS, HttpStatus.OK);
   } catch (error) {
      res.status(403).json({ message: error.message });
   }
};

export const createAccount = async (req, res) => {
   try {
      let {
         profileImage,
         name,
         mobileNumber,
         countryCode,
         gender,
         email,
         dob,
         language,
         password,
         documents,
         isSmoke,
         deviceToken,
         deviceType,
         long,
         lat,
         isDocumentsUploaded,
      } = req.body;
      let deliveryData = await Delivery_Model.findOne({
         countryCode: countryCode,
         mobileNumber: mobileNumber,
      });
      const lowerCaseEmail = email.toLowerCase();

      if (deliveryData) {
         return sendErrorResponse(res, 'already exist', HttpStatus.BAD_REQUEST);
      }
      if (!password) {
         return sendErrorResponse(res, 'Please enter password', HttpStatus.BAD_REQUEST);
      }
      if (!mobileNumber) {
         return sendErrorResponse(res, 'Please enter mobile number', HttpStatus.BAD_REQUEST);
      }
      if (!countryCode) {
         return sendErrorResponse(res, 'Please enter country code', HttpStatus.BAD_REQUEST);
      }
      let newpassword = await generatePassword(password);
      let loc = { type: 'Point', coordinates: [long, lat] };
      let otp = 123456;
      let accessToken = generateJwtToken(
         {
            email: lowerCaseEmail,
            countryCode: countryCode,
            mobileNumber: mobileNumber,
            type: 'register',
            otp: otp,
         },
         '1h'
      ).token;
      let dataToSave = {
         profileImage: profileImage,
         name: name,
         dob: dob,
         language: language,
         isDocumentsUploaded: true,
         gender: gender,
         email: lowerCaseEmail,
         isSmoke: isSmoke,
         deviceType: deviceType,
         password: newpassword,
         documents: documents,
         countryCode: countryCode,
         mobileNumber: mobileNumber,
         deviceToken: deviceToken,
         location: loc,
         otp: otp,
         accessToken: accessToken,
      };
      const createUser = await new Delivery_Model(dataToSave).save();
      const notification = new notificationModel({
         notification_type: 1,
         title: "New Delivery Partner Registered",
         description: `${name || 'A new delivery partner'} has registered with mobile ${countryCode} ${mobileNumber}.`,
         sendTo: 1,
      });

      await notification.save();

      return sendSuccessResponse(
         res,
         { accessToken: accessToken, countryCode: countryCode, mobileNumber: mobileNumber },
         success.OTP_SENT,
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const login = async (req, res) => {
   try {
      let { mobileNumber, password, lat, long, deviceToken, countryCode } = req.body;

      console.log('mobileNumber....', mobileNumber, countryCode);

      let deliveryData = await commonService.findOne(Delivery_Model, {
         countryCode: countryCode,
         mobileNumber: mobileNumber,
         isDeleted: false,
      });

      if (!deliveryData) {
         let errorMessage = 'No Delivery Boy Data on this countryCode or mobileNumber';
         return sendErrorResponse(res, errorMessage, HttpStatus.BAD_REQUEST);
      } else {
         let checkPassword = false;
         checkPassword = await comparePassword(password, deliveryData.password);
         if (checkPassword) {
            let saveData = {
               accessToken: generateJwtToken(
                  {
                     countryCode: deliveryData.countryCode,
                     mobileNumber: deliveryData.mobileNumber,
                     deviceToken: deliveryData.deviceToken,
                     _id: deliveryData._id,
                     type: 'login',
                     otp: deliveryData.otp,
                  },
                  '24h'
               ).token,
               'location.coordinates': [long, lat],
               deviceToken: deviceToken,
            };
            let update = await commonService.findOneAndUpdate(
               Delivery_Model,
               deliveryData._id,
               saveData
            );

            let data = {
               saveData,
               update,
            };
            if (!update) {
               return sendErrorResponse(res, error.unableToLogin, HttpStatus.SOMETHING_WRONG);
               //return sendErrorResponse(res,data, HttpStatus.SOMETHING_WRONG);
            } else {
               return sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
            }
         } else {
            return sendErrorResponse(res, error.PASS_NOT_MATCHED, HttpStatus.NOT_FOUND);
         }
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const verifyOtp = async (req, res) => {
   try {
      const delivery = req.deliveryData;
      const { otp } = req.body;

      if (otp !== delivery.otp) {
         return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.SOMETHING_WRONG);
      }
      const sendData = await generateJwtToken(
         {
            email: delivery.email,
            countryCode: delivery.countryCode,
            mobileNumber: delivery.mobileNumber,
            otp: otp,
         },
         '24h'
      ).token;
      const updatePass = await commonService.findOneAndUpdate(
         Delivery_Model,
         { _id: delivery._id },
         { accessToken: sendData, isOtpVerified: true }
      );
      if (updatePass) {
         return sendSuccessResponse(
            res,
            { accessToken: updatePass.accessToken },
            success.OTP_VERIFIED,
            HttpStatus.OK
         );
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
export const addVechileDetails = async (req, res) => {
   try {
      const rest = req.deliveryData;
      let {
         vechileName,
         drivingLicenseFront,
         drivingLicenseBack,
         certificate,
         RegistrationCertificateFront,
         RegistrationCertificateBack,
         imageFront,
         imageBack,
      } = req.body;

      const findRes = await commonService.findOne(Delivery_Model, { _id: rest._id });
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         vechileDetails: {
            vechileName: vechileName,
            drivingLicenseFront: drivingLicenseFront,
            certificate: certificate,
            drivingLicenseBack: drivingLicenseBack,
            RegistrationCertificateFront: RegistrationCertificateFront,
            RegistrationCertificateBack: RegistrationCertificateBack,
            imageFront: imageFront,
            imageBack: imageBack,
         },
         isVechileDocUploaded: true,
      };
      const updateRes = await commonService.findOneAndUpdate(Delivery_Model, findRes._id, data);
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
      const rest = req.deliveryData;
      let { bankAccountNo, accHolderName, bankCode, bankName } = req.body;

      const findRes = await commonService.findOne(Delivery_Model, { _id: rest._id });
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
      };
      const updateRes = await commonService.findOneAndUpdate(Delivery_Model, findRes._id, data);
      if (updateRes) {
         return sendSuccessResponse(res, updateRes, success.UPDATED, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
export const deliverylogout = async (req, res) => {
   try {
      const id = req.deliveryData;
      const checkData = await commonService.findOneAndUpdate(Delivery_Model, id._id, {
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

export const resetPassword = async (req, res) => {
   try {
      let { mobileNumber, countryCode } = req.body;
      const findRes = await commonService.findOne(Delivery_Model, {
         countryCode: countryCode,
         mobileNumber: mobileNumber,
      });
      console.log(findRes);
      if (!findRes) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let otp = 123456;
      const sendData = await generateJwtToken(
         {
            email: findRes.email,
            countryCode: findRes.countryCode,
            mobileNumber: findRes.mobileNumber,
            otp: otp,
         },
         '24h'
      ).token;
      await commonService.findOneAndUpdate(
         Delivery_Model,
         { _id: findRes._id },
         { accessToken: sendData }
      );
      return sendSuccessResponse(res, { accessToken: sendData }, success.OTP_SENT, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const generateNewPassword = async (req, res) => {
   try {
      const delivery = req.deliveryData;
      const { currentPassword, password } = req.body;
      let check = await comparePassword(currentPassword, delivery.password);
      if (!check) {
         return sendErrorResponse(res, 'Current Password is incorrect', HttpStatus.BAD_REQUEST);
      }
      const newPassword = await generatePassword(password);

      const updatePass = await commonService.findOneAndUpdate(
         Delivery_Model,
         { _id: delivery._id },
         { password: newPassword }
      );
      if (updatePass) {
         return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const changePassword = async (req, res) => {
   try {
      let resData = req.deliveryData;
      let check = await comparePassword(req.body.currentPassword, resData.password);
      if (!check) {
         return sendErrorResponse(res, 'Current Password is incorrect', HttpStatus.BAD_REQUEST);
      }
      const newPassword = await generatePassword(req.body.password);
      await commonService.findOneAndUpdate(Delivery_Model, resData._id, { password: newPassword });
      return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
export const driverDocumentUpdate = async (req, res) => {
   try {
      let { idProofFront, idProofBack, policeBackground, password } = req.body;
      let resData = req.deliveryData;
      const newPassword = await generatePassword(password);
      let data = {
         password: newPassword,
         isDocumentsUploaded: true,
         fullyVerify: 0,
         documents: {
            idProofFront: idProofFront,
            idProofBack: idProofBack,
            policeBackground: policeBackground,
         },
      };
      await commonService.findOneAndUpdate(Delivery_Model, resData._id, data);
      return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
   } catch (error) {
      console.log(error);
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDeliveryStatus = async (req, res) => {
   try {
      const { deliveryBoyId, status } = req.query;

      if (!deliveryBoyId && deliveryBoyId.length < 1) {
         return sendErrorResponse(res, 'deliveryBoyId required', HttpStatus.BAD_REQUEST);
      }
      if (!status && status.length < 1) {
         return sendErrorResponse(res, 'status required', HttpStatus.BAD_REQUEST);
      }
      const updateDeliveryData = await Delivery_Model.findOneAndUpdate(
         { _id: new mongoose.Types.ObjectId(deliveryBoyId) },
         { $set: { status: status } },
         { new: true }
      );

      return sendSuccessResponse(res, updateDeliveryData, success.UPDATED, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deliveryBoyDetails = async (req, res) => {
   try {
      let { accesstoken } = req.headers;

      const deliveryData = await Delivery_Model.findOne({ accessToken: accesstoken });

      return sendSuccessResponse(res, deliveryData, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDeliveryBoyDetails = async (req, res) => {
   try {
      let { accesstoken } = req.headers;

      let { coordinates } = req.body;

      const updateDeliveryData = await Delivery_Model.findOneAndUpdate(
         { accessToken: accesstoken },
         { $set: { 'location.coordinates': coordinates } },
         { new: true }
      );

      return sendSuccessResponse(res, updateDeliveryData, success.UPDATED, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteAccount = async (req, res) => {
   try {
      let { accesstoken } = req.headers;

      const updateDeliveryData = await Delivery_Model.findOneAndUpdate(
         { accessToken: accesstoken },
         { $set: { isDeleted: true } },
         { new: true }
      );

      return sendSuccessResponse(res, {}, success.DELETED_SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDriverProfile = async (req, res) => {
   try {
      let deliveryBoy = req.deliveryData;
      let { profileImage, name, email, dob, gender, language, documents } = req.body;

      let data = {
         profileImage: profileImage,
         name: name,
         email: email,
         dob: dob,
         gender: gender,
         language: language,
         documents: documents,
      };
      const updateDeliveryData = await Delivery_Model.findOneAndUpdate(
         { _id: deliveryBoy._id },
         { $set: data },
         { new: true }
      );
      if (updateDeliveryData) {
         return sendSuccessResponse(
            res,
            updateDeliveryData,
            success.DELETED_SUCCESS,
            HttpStatus.OK
         );
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const driverLogout = async (req, res) => {
   try {
      const id = req.deliveryData;
      const checkData = await commonService.findOneAndUpdate(Delivery_Model, id._id, {
         accessToken: '',
      });
      if (!checkData) {
         return sendErrorResponse(res, "Delivery boy Not Found", HttpStatus.BAD_REQUEST);
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
