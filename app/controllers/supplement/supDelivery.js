import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SupDeliveryModel } from '../../models/supplement/supDeliveryCharge'

export const createEdit = async (req, res) => {
   try {
      let supData = req.supplementData
      req.body.supplementSeller = supData._id;
      let check = await commonService.findOne(SupDeliveryModel, { type: 1 });
      if (check) {
         const data = await commonService.findOneAndUpdate(SupDeliveryModel, check._id, req.body);
         return sendSuccessResponse(
            res,
            { deliveryCharge: data.deliveryCharge, minOrderToFree: data.minOrderToFree },
            success.UPDATED,
            HttpStatus.OK
         );
      }
      const addCat = await commonService.create(SupDeliveryModel, req.body);
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

export const supDeliverylist = async (req, res) => {
   try {
      let supData = req.supplementData
      let list = await commonService.findOne(SupDeliveryModel, { type: 1 });
      return sendSuccessResponse(res, list, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
