
import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { DeliveryFare_Model } from '../../models/admin/deliveryFare.model';

export const addupdateDeliveryFare = async (req, res) => {
    try {
        if (!req.body.service) {
            return sendErrorResponse(res, "please send service", HttpStatus.BAD_REQUEST)
        }
        if (!req.body.baseFare) {
            return sendErrorResponse(res, "please send baseFare", HttpStatus.BAD_REQUEST)
        }
        if (!req.body.perKmFare) {
            return sendErrorResponse(res, "please send perKmFare", HttpStatus.BAD_REQUEST)
        }
        if (!req.body.freeDeliveryApplicable) {
            return sendErrorResponse(res, "please send freeDeliveryApplicable", HttpStatus.BAD_REQUEST)
        }
        let Exist = await commonService.getByCondition(DeliveryFare_Model, { service: req.body.service })
        if (Exist) {
            await commonService.findOneAndUpdateWithOtherKey(DeliveryFare_Model, { service: Exist.service }, req.body)
            return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK)
        } else {
            await commonService.create(DeliveryFare_Model, req.body)
            return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK)
        }
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const deliveryFareList = async (req, res) => {
    try {
        if (!req.query.service) {
            return sendErrorResponse(res, "please send service", HttpStatus.BAD_REQUEST)
        }
        let deliveryFarelist = await commonService.getByCondition(DeliveryFare_Model, { service: Number(req.query.service) })
        return sendSuccessResponse(res, deliveryFarelist, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}