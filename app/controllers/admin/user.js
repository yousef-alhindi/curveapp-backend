import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import UserModel from '../../models/user/user.model';

export const getUserList = async (req, res) => {
   try {
      const getAllUser = await commonService.findAll(UserModel);
      if (getAllUser) {
         sendSuccessResponse(res, getAllUser, success.USER_LIST, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const blockUnblockUser = async (req, res) => {
   try {
      const { id, isBlocked } = req.body;
      const checkUser = await commonService.findById(UserModel, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const data = {
         isBlocked: isBlocked,
      };
      const updated = await commonService.findOneAndUpdate(UserModel, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
