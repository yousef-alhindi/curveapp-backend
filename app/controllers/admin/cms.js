
import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { cmsModel } from '../../models/admin/cms.model';


export const addupdateCms = async (req, res) => {
    try {
        if (!req.body.type) {
            return sendErrorResponse(res, error.TYPE_NOT_FOUND, HttpStatus.BAD_REQUEST)
        }
        if (!req.body.service) {
            return sendErrorResponse(res, "please send service", HttpStatus.BAD_REQUEST)
        }
        let cmsExist = await commonService.getByCondition(cmsModel, { service: req.body.service, type: req.body.type })
        if (cmsExist) {
            await commonService.findOneAndUpdateWithOtherKey(cmsModel, { service: cmsExist.service, type: cmsExist.type }, req.body)
            return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK)
        } else {
            await commonService.create(cmsModel, req.body)
            return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK)
        }
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const getCms = async (req, res) => {
    try {
        if (!req.query.type) {
            return sendErrorResponse(res, error.TYPE_NOT_FOUND,HttpStatus.BAD_REQUEST)
        }
        if (!req.query.service) {
            return sendErrorResponse(res, "please send service",HttpStatus.BAD_REQUEST)
        }
        let cms = await commonService.getByCondition(cmsModel,{service:req.query.service, type: req.query.type })
        return sendSuccessResponse(res, { cms: cms }, success.SUCCESS, HttpStatus.OK )
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}