import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { SubscriptionModel } from '../../models/admin/subscription.model';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const getList = async (req, res) => {
   try {
      const getAllRest = await commonService.findAll(SubscriptionModel, { restaurantStatus: 0 });
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

export const create = async (req, res) => {
   try {
      let data = req.body;
      const addOffer = await commonService.create(SubscriptionModel, data);
      if (addOffer) {
         sendSuccessResponse(res, addOffer, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const edit = async (req, res) => {
   try {
      let data = req.body;

      const checkOffer = await commonService.findOne(SubscriptionModel, { _id: data._id });
      if (!checkOffer) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(SubscriptionModel, checkOffer._id, data);
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteSubscription = async (req, res) => {
   try {
      let { id } = req.params;
      const checkResCat = await commonService.findOne(SubscriptionModel, { _id: id });
      console.log(checkResCat);
      if (!checkResCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndDelete(SubscriptionModel, {
         _id: checkResCat._id,
      });
      if (update) {
         sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
