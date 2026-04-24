import { cmsModel } from "../../models/admin/cms.model";
import { FAQ_MODEL } from '../../models/admin/faq.model';
import * as commonService from '../../services/common/common.service';
import { error, success } from '../../responses/messages';
import { sendErrorResponse, sendSuccessResponse } from "../../responses/response";

export const getUserCms = async (req, res) => {
    try {
        const { type, service = 1 } = req.query;

        if (!service) {
            return sendErrorResponse(res, 'Please provide a service', 400);
        }

        const cms = await commonService.getByCondition(cmsModel, {
            service,
            type
        });

        return sendSuccessResponse(res, cms, success.SUCCESS, 200);
    } catch (error) {
        console.error(error);
        return sendErrorResponse(res, error.message, 500);
    }
};

export const userfaqList = async (req, res) => {
    try {
        let { search = '', page = 1, limit = 10, service } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        const skipIndex = (page - 1) * limit;

        let params = {
            isDeleted: false,
            status: true,
            service: service,
        };

        if (search && search.trim() !== '') {
            params.$or = [{ question: { $regex: `.*${search}.*`, $options: 'i' } }];
        }

        const list = await FAQ_MODEL.find(params)
            .sort({ createdAt: -1 })
            .skip(skipIndex)
            .limit(limit);

        return sendSuccessResponse(res, list, 'FAQ List', 200);
    } catch (error) {
        console.error(error);
        return sendErrorResponse(res, error.message, 500);
    }
};