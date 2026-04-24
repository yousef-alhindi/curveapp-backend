import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestDeliveryModel } from '../../models/restaurant/restDeliveryCharge';

export const createEdit = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      let check = await commonService.findOne(RestDeliveryModel, { type: 1 });
      if (check) {
         const data = await commonService.findOneAndUpdate(RestDeliveryModel, check._id, req.body);
         return sendSuccessResponse(
            res,
            { deliveryCharge: data.deliveryCharge, minOrderToFree: data.minOrderToFree },
            success.UPDATED,
            HttpStatus.OK
         );
      }
      const addCat = await commonService.create(RestDeliveryModel, req.body);
      return sendSuccessResponse(
         res,
         { deliveryCharge: addCat.deliveryCharge, minOrderToFree: addCat.minOrderToFree },
         success.SUCCESS,
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const restDeliverylist = async (req, res) => {
   try {
      let resData = req.restaurantData;
      let list = await commonService.findOne(RestDeliveryModel, { type: 1 });
      return sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
