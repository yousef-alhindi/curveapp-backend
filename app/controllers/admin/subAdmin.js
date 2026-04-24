import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import AdminModel from '../../models/admin/admin.model';
const mongoose = require('mongoose'); // mongoose database
import { generatePassword, comparePassword } from '../../utils/password';

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/

 export const addSubAdmin = async (req, res) => {
    try {
        const { fullName, email, countryCode, phoneNumber,address, password, confirmPassword,permissions } = req.body;

        // Check if password and confirm password match
        if (password !== confirmPassword) {
            return sendErrorResponse(res, "Password and confirm password do not match", HttpStatus.BAD_REQUEST);
        }

        // Check if the email or phone number is already taken
        const existingAdmin = await AdminModel.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingAdmin) {
            return sendErrorResponse(res, "Email or phone number already exists.", HttpStatus.CONFLICT);
        }

        const lowerCaseEmail = email.toLowerCase();
        //let generatedPassword = await generatePassword(password);
  
        // Create new subAdmin
        const newSubAdmin = new AdminModel({
           fullName,
           email:lowerCaseEmail,
           countryCode,
           phoneNumber,
           address,
           password:password,
           role: 1, // subAdmin
           permissions, // Permissions provided in the request body
        });
  
        await newSubAdmin.save();
  
        return sendSuccessResponse(res, newSubAdmin, success.SUCCESS, HttpStatus.OK);
     } catch (error) {
        console.error(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
     }
   
 };

 export const getSubAdmins = async (req, res) => {
    try {
        const subAdmins = await AdminModel.find({ role: 1, isDeleted: false });
        return sendSuccessResponse(res, subAdmins, success.SUCCESS, HttpStatus.OK);
     } catch (error) {
        console.error(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
     }
 }

 export const editSubAdmin = async (req, res) => {
   try {
      const { id } = req.params;
      const { fullName, email, countryCode, phoneNumber, address, password, confirmPassword,permissions, isBlocked } = req.body;
      const subAdmin = await AdminModel.findById(id);
      if (!subAdmin) {
         return res.status(404).json({ message: 'subAdmin not found.' });
      }

       // Check if password and confirm password match
       if (password !== confirmPassword) {
         return sendErrorResponse(res, "Password and confirm password do not match", HttpStatus.BAD_REQUEST);
     }

     if(email){
      const lowerCaseEmail = email.toLowerCase();
      subAdmin.email = lowerCaseEmail || subAdmin.email;
     }
     if(password){
      //let generatedPassword = await generatePassword(password);
      subAdmin.password = password || subAdmin.password;
      subAdmin.accessToken = null;
     }

      // Update the subAdmin
      subAdmin.fullName = fullName || subAdmin.fullName;
      subAdmin.countryCode = countryCode || subAdmin.countryCode;
      subAdmin.phoneNumber = phoneNumber || subAdmin.phoneNumber;
      subAdmin.address = address || subAdmin.address;
      subAdmin.permissions = permissions || subAdmin.permissions;
      subAdmin.isBlocked = isBlocked !== undefined ? isBlocked : subAdmin.isBlocked;
      subAdmin.updatedAt = new Date().getTime();

      //let updateSubAdmin = await subAdmin.save();
      let updateSubAdmin = await AdminModel.findOneAndUpdate(
         subAdmin._id,
         {$set:subAdmin},
         {new:true}
      )
      return sendSuccessResponse(res, updateSubAdmin, success.UPDATED, HttpStatus.OK);
    } catch (error) {
       console.error(error);
       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const blockUnblockSubAdmin = async (req, res) => {
   try {
      const { id } = req.params;
      const { isBlocked } = req.body;
      const subAdmin = await AdminModel.findById(id);
      if (!subAdmin) {
         return res.status(404).json({ message: 'subAdmin not found.' });
      }

      subAdmin.isBlocked = isBlocked;
      subAdmin.updatedAt = new Date().getTime();
      subAdmin.accessToken = null;

      //let updateSubAdmin = await subAdmin.save();
      let updateSubAdmin = await AdminModel.findOneAndUpdate(
         subAdmin._id,
         {$set:subAdmin},
         {new:true}
      )

      return sendSuccessResponse(res, updateSubAdmin, `subAdmin ${isBlocked ? 'blocked' : 'unblocked'} successfully`, HttpStatus.OK);
    } catch (error) {
       console.error(error);
       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deleteSubAdmin = async (req, res) => {
   try {
      const { id } = req.params;
      const subAdmin = await AdminModel.findById(id);
      if (!subAdmin) {
         return res.status(404).json({ message: 'subAdmin not found.' });
      }

      subAdmin.isDeleted = true;
      subAdmin.updatedAt = new Date().getTime();
      subAdmin.accessToken = null;

      //let updateSubAdmin = await subAdmin.save();
      let updateSubAdmin = await AdminModel.findOneAndUpdate(
         subAdmin._id,
         {$set:subAdmin},
         {new:true}
      )

      return sendSuccessResponse(res, updateSubAdmin, 'subAdmin deleted successfully', HttpStatus.OK);
    } catch (error) {
       console.error(error);
       return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}