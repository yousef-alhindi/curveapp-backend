
import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { Commission_Model } from '../../models/admin/commision.model';

export const addupdateCommission = async (req, res) => {
    try {
        if (!req.body.service) {
            return sendErrorResponse(res, "please send service", HttpStatus.BAD_REQUEST)
        }

        if (!req.body.percentage) {
            return sendErrorResponse(res, "please send percentage", HttpStatus.BAD_REQUEST)
        }

        let Exist = await commonService.getByCondition(Commission_Model, { service: req.body.service })
        if (Exist) {
            await commonService.findOneAndUpdateWithOtherKey(Commission_Model, { service: Exist.service }, req.body)
            return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK)
        } else {
            await commonService.create(Commission_Model, req.body)
            return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK)
        }
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getCommission = async (req, res) => {
    try {
        if (!req.query.service) {
            return sendErrorResponse(res, "please send service", HttpStatus.BAD_REQUEST)
        }
        let commission = await commonService.getByCondition(Commission_Model, { service: Number(req.query.service) })
        return sendSuccessResponse(res, commission, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}