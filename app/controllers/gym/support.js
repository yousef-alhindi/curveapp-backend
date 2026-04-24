import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import * as commonService from '../../services/common/common.service';
import { error, success } from '../../responses/messages';
var randomize = require('randomatic');
import { SUPPORT_MODEL } from '../../models/admin/support.model';

/****************************************
*************** SPRINT 8 ****************
***************body**************************/

export const gymSupport = async (req, res) => {
    try {
        const gymData = req.gymData;
        req.body.userId = gymData._id;
        if (!req.body.service) {
            return sendErrorResponse(res, error.Service_Required, HttpStatus.BAD_REQUEST);
        }
        let ticketId;
        let existingTicket;

        do {
            ticketId = '#' + await randomize('0', 9);
            existingTicket = await commonService.findOne(SUPPORT_MODEL, { ticketId });
        } while (existingTicket);
        req.body.ticketId = '#' + ticketId;
        req.body.createdAt = new Date().getTime()
        req.body.updatedAt = new Date().getTime()
        await commonService.create(SUPPORT_MODEL, req.body);
        return sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const gymSupportlist = async (req, res) => {
    try {
        let { page = 1, limit = 10, service } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        let skipIndex = (page - 1) * limit;
        let params = { service: service, userId: String(req.gymData?._id) };
        let total = await SUPPORT_MODEL.countDocuments(params);
        let list = await SUPPORT_MODEL.find(params)
            .sort({ createdAt: -1 })
            .skip(skipIndex)
            .limit(limit);
        return sendSuccessResponse(res, { total: total, list: list }, 'support List', HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

