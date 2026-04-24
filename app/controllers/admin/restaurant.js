import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';

export const getResListPending = async (req, res) => {
   try {
      const getAllRest = await commonService.getAll(RestaurantModel, { restaurantStatus: 0, isBankDetailsUpdated
: true });
      if (getAllRest) {
         sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getResListAccepted = async (req, res) => {
   try {
      const getAllRest = await commonService.getAll(RestaurantModel, { restaurantStatus: 1 });
      if (getAllRest) {
         sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getResListRejected = async (req, res) => {
   try {
      const getAllRest = await commonService.getAll(RestaurantModel, { restaurantStatus: 2  });
      if (getAllRest) {
         sendSuccessResponse(res, getAllRest, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateResStatus = async (req, res) => {
   try {
      const { id, restaurantStatus, rejected_reason } = req.body;
      const checkUser = await commonService.findById(RestaurantModel, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         restaurantStatus: restaurantStatus,
         rejected_reason: rejected_reason ? rejected_reason : '',
      };

      if (restaurantStatus === 2) {
         data.isBankDetailsUpdated = false;
         data.isDocumentsUploaded = false;
      }
      const updated = await commonService.findOneAndUpdate(RestaurantModel, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const blockUnblockUser = async (req, res) => {
   try {
      const { id, isBlocked } = req.body;
      const checkUser = await commonService.findById(RestaurantModel, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const data = {
         isBlocked: isBlocked,
      };
      const updated = await commonService.findOneAndUpdate(RestaurantModel, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
