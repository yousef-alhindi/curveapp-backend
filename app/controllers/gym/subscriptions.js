import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import * as commonService from '../../services/common/common.service';
import { error, success } from '../../responses/messages';
import { SUPPORT_MODEL } from '../../models/admin/support.model';
import GymSubscriptions from '../../models/gym/gymSubscriptions';
import mongoose from 'mongoose';

export const gymSubscriptions = async (req, res) => {
    try {
        const gymId = req.gymData?._id || "676cf6b401881044bb1b1a83";
        const { search, page = 1, limit = 10, active, startDate, endDate } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const searchQuery = {}
        if (search) {
            searchQuery.$or = [
                { subscriptionId: { $regex: search, $options: 'i' } },
                { "user.fullName": { $regex: search, $options: 'i' } }
            ]
        }
        const matchStage = { gymId: new mongoose.Types.ObjectId(gymId) };

        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: Number(startDate),
                $lte: Number(endDate),
            };
        }

        if (active) {
            const currentDate = new Date().getTime();
            matchStage.endDate = active === 'true'
                ? { $gte: currentDate }
                : { $lt: currentDate };
        }
        const subscriptionsPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "User",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $match: searchQuery
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ];

        const countPipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "User",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $match: searchQuery
            },
            { $count: "totalRecords" }
        ];

        const [subscriptions, countResult] = await Promise.all([
            GymSubscriptions.aggregate(subscriptionsPipeline),
            GymSubscriptions.aggregate(countPipeline)
        ]);

        const totalRecords = countResult.length > 0 ? countResult[0].totalRecords : 0;

        return sendSuccessResponse(
            res,
            { subscriptions, totalRecords, totalPages: Math.ceil(totalRecords / limit), page: parseInt(page), limit: parseInt(limit) },
            "Subscriptions list",
            HttpStatus.OK
        );
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};


export const gymSubscriptionDetails = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const details = await GymSubscriptions.findById(subscriptionId).populate({
            path: "gymCartId",
            populate: {
                path: "packageId",
            }
        })
        if (!details) {
            return sendErrorResponse(res, "Subscription not found", HttpStatus.NOT_FOUND);
        }
        return sendSuccessResponse(res, details, 'Details', HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

