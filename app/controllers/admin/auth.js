import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { generatePassword, comparePassword } from '../../utils/password';
import AdminModel from '../../models/admin/admin.model';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { generateJwtToken } from '../../utils/jwt';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/
export const uploadAdminFile = async (req, res) => {
   try {
      if (req.files.upload_admin_file != undefined || req.files.upload_admin_file != null) {
         req.body.upload_admin_file = req.files.upload_admin_file[0].location
            ? req.files.upload_admin_file[0].location
            : '';
      }
      let { upload_admin_file } = req.body;
      if (!upload_admin_file || upload_admin_file == '')
         return { status: 0, message: 'File is required' };
      return sendSuccessResponse(res, upload_admin_file, success.UPLOAD_SUCCESS, HttpStatus.OK);
   } catch (error) {
      res.status(403).json({ message: error.message });
   }
};

export const createAccount = async (req, res) => {
   try {
      let { fullName, email, password, countryCode, phoneNumber, address, role, deviceToken } =
         req.body;
      const lowerCaseEmail = email.toLowerCase();
      password = await generatePassword(password);

      let dataToSave = {
         fullName: fullName,
         email: lowerCaseEmail,
         password: password,
         countryCode: countryCode,
         phoneNumber: phoneNumber,
         address: address,
         role: role,
         deviceToken: deviceToken,
      };
      const data = await commonService.create(AdminModel, dataToSave);
      if (data) {
         sendSuccessResponse(res, data, success.adminCreated, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const login = async (req, res) => {
   try {
      let { email, password, lat, long, deviceToken } = req.body;
      const lowerCaseEmail = email.toLowerCase();

      // var isSubAdmin = 0;

      let adminData = await commonService.getByCondition(AdminModel, {
         email: lowerCaseEmail,
      });
      // if(!adminData){
      //     adminData  = await commonService.getByCondition(SubAdminModel, {email : email})
      // }
      if (!adminData) {
         return sendErrorResponse(res, error.ADMIN_NOT_FOUND, HttpStatus.BAD_REQUEST);
      } else {
         // const passwordMatch = await comparePassword(password, adminData.password )
         // if(!passwordMatch) {
         //   return sendErrorResponse(res, error.passwordNotMatch, HttpStatus.UNAUTHORIZED)
         // }

         let checkPassword = false;
         //   let subAdminData  = await commonService.getByCondition(SubAdminModel, {email : email})
         //   if (subAdminData) {
         //     isSubAdmin = 1;
         //     if (subAdminData.passwordWithoutEncryption === password) {
         //       checkPassword = true;
         //     }
         //     if (subAdminData.isBlocked == true) {
         //       return sendErrorResponse(res, error.SUB_ADMIN_BLOCKED, HttpStatus.UNAUTHORIZED)
         //     }
         //   } else {
         if(adminData.role===1){   //SUBADMIN
            if (password === adminData.password) {
               checkPassword = true;
           }
         }
         if(adminData.role===0){   //ADMIN
            checkPassword = await comparePassword(password, adminData.password);
            console.log(checkPassword);
         }
         //   }
         if (checkPassword) {
            let saveData = {
               accessToken: generateJwtToken({ email: adminData.email }, '24h').token,
               location: [long, lat],
               lastLogin: new Date().getTime(),
               deviceToken: deviceToken,
            };
            let update;
            // if (isSubAdmin == 1) {
            //   update = await commonService.findOneAndUpdate(SubAdminModel,subAdminData._id,saveData);
            // } else {
            update = await commonService.findOneAndUpdate(AdminModel, adminData?._id, saveData);
            // }
            // let result = { isSubAdmin: isSubAdmin, ...update._doc };
            // delete result.update;

            if (!update) {
               return sendErrorResponse(res, error.unableToLogin, HttpStatus.SOMETHING_WRONG);
            } else {
               if(update.role===1){
                  return sendSuccessResponse(res, update, "Sub-Admin login successfully", HttpStatus.OK);
               }else{
                  return sendSuccessResponse(res, update, success.adminLoginSuccess, HttpStatus.OK);
               }
            }
         } else {
            return sendErrorResponse(res, error.PASS_NOT_MATCHED, HttpStatus.NOT_FOUND);
         }
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const forgetPassword = async (req, res) => {
   try {
      const { email } = req.body;
      const lowerCaseEmail = email.toLowerCase();
      const checkAdminEmail = await commonService.findOne(AdminModel, { email: lowerCaseEmail });
      if (!checkAdminEmail) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const sendData = generateJwtToken({ email: checkAdminEmail.email }, '24h').token;
      const updatePass = await commonService.findOneAndUpdate(
         AdminModel,
         { _id: checkAdminEmail._id },
         { accessToken: sendData }
      );

      if (updatePass) {
         return sendSuccessResponse(
            res,
            { accessToken: updatePass.accessToken },
            success.OTP_SENT,
            HttpStatus.OK
         );
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const verifyOtp = async (req, res) => {
   try {
      const admin = req.adminData;
      const { otp } = req.body;

      if (otp !== admin.otp) {
         return sendErrorResponse(res, error.OTP_NOT_MATCHED, HttpStatus.SOMETHING_WRONG);
      }
      const sendData = generateJwtToken({ email: admin.email }, '24h').token;
      const updatePass = await commonService.findOneAndUpdate(
         AdminModel,
         { _id: admin._id },
         { accessToken: sendData }
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

export const resetPassword = async (req, res) => {
   try {
      const admin = req.adminData;
      const { password, confirmPass } = req.body;

      if (password !== confirmPass) {
         return sendErrorResponse(res, error.PASS_NOT_MATCHED, HttpStatus.SOMETHING_WRONG);
      }
      const newPassword = await generatePassword(req.body.password);

      const updatePass = await commonService.findOneAndUpdate(
         AdminModel,
         { _id: admin._id },
         { password: newPassword, accessToken: '' }
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

export const profile = async(req,res)=>{
   try {
      const admin = req.adminData;
      if (admin) {
         return sendSuccessResponse(res, admin, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateProfile = async(req, res)=>{
   try {
      const admin = req.adminData;
      const data = req.body
      const updatedAdminData = AdminModel.findOneAndUpdate({_id : admin._id}, data, {new : true}).lean()
      if (updatedAdminData) {
         return sendSuccessResponse(res, updatedAdminData, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const changePassword = async(req,res)=>{
      try{
         const admin = req.adminData;
      const {oldPassword, password, confirmPassword} = req.body;
      if(oldPassword === newPassword){
         return sendErrorResponse(res, "New password not same as old password", HttpStatus.SOMETHING_WRONG)
      }
      if(password !== confirmPassword){
         return sendErrorResponse(res, "New password and confirm password must be same", HttpStatus.SOMETHING_WRONG);
      }
      const newPassword = await generatePassword(req.body.password);
      const updatePass = await commonService.findOneAndUpdate(
         AdminModel,
         { _id: admin._id },
         { password: newPassword, accessToken: '' }
      );
      if (updatePass) {
         return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
   }catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }  
}