
import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SUPPORT_MODEL } from '../../models/admin/support.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;

export const Supportlist = async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", fromDate = '', toDate = '', service } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        let skipIndex = (page - 1) * limit;
        let params = {};
        if (!!service) {
            params = { service: Number(service) };
        }

        if (!!search) {
            params = Object.assign(params, {
                $or: [
                    { "ownerName": { $regex: search, $options: "i" } },
                    { ticketId: { $regex: search, $options: "i" } },
                ],
            })
        }
        
        if (!!fromDate) {
            fromDate = new Date(fromDate);
            fromDate.setUTCHours(0, 0, 0, 0);
            fromDate = fromDate.getTime()
        }

        if (!!toDate) {
            toDate = new Date(toDate);
            toDate.setUTCHours(23, 59, 59, 999);
            toDate = toDate.getTime()
        }

        if (!!fromDate && !!toDate) {
            params = Object.assign(params, {
                registerDate: {
                    $gte: fromDate,
                    $lte: toDate
                },
            });
        }

        console.log("params======+>", params)
        const pipeline = [
            {
                $addFields: {
                    userIdObjectId: {
                        $convert: {
                            input: "$userId",
                            to: "objectId"
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "Restaurant",
                    localField: "userIdObjectId",
                    foreignField: "_id",
                    as: "detail"
                }
            },
            {
                $unwind: "$detail"
            },
            {
                $project: {
                    mobileNumber: "$detail.mobileNumber",
                    ownerName: "$detail.ownerName",
                    countryCode: "$detail.countryCode",
                    email: "$detail.email",
                    service: 1,
                    ticketId: 1,
                    image: 1,
                    query: 1,
                    supportStatus: 1,
                    status: 1,
                    createdAt: 1,
                    registerDate: "$createdAt"
                }
            },
            {
                $match: params
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            { $skip: skipIndex },
            { $limit: limit }
        ]

        let count = await SUPPORT_MODEL.aggregate(pipeline)
        let list = await SUPPORT_MODEL.aggregate(pipeline)
        return sendSuccessResponse(res, { count: count.length, list: list }, "Support List", HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const supportChangeStatus = async (req, res) => {
    try {
        let { supportId, supportStatus } = req.query
        console.log(supportId, supportStatus)
        let data = await commonService.findOneAndUpdate(SUPPORT_MODEL, { _id: new ObjectId(supportId) }, { supportStatus: Number(supportStatus) })
        return sendSuccessResponse(res, {}, success.UPDATED, HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}