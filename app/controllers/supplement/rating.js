import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import * as commonService from '../../services/common/common.service';
import { error, success } from '../../responses/messages';
var randomize = require('randomatic');
import { SUPPORT_MODEL } from '../../models/admin/support.model';
import { SUPPLEMENT_ORDER_RATING_MODEL } from '../../models/supplement/supplementRating.model';
import mongoose from 'mongoose';

export const allRatings = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const supData = req.supplementData;
        const supplementSellerId = supData?._id;
        console.log(supplementSellerId);
        const searchFilter = {};

        if (search) {
            searchFilter.$or = [
                { 'orderId.orderId': { $regex: search, $options: 'i' } },
                { 'userId.fullName': { $regex: search, $options: 'i' } },
            ];
        }

        // Match condition for seller ID
        const matchCondition = { supplementSellerId: new mongoose.Types.ObjectId(supplementSellerId) };

        // Count total documents
        const totalDocuments = await SUPPLEMENT_ORDER_RATING_MODEL.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'User',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId'
                }
            },
            {
                $unwind: {
                    path: '$userId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'supplementorders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'orderId'
                }
            },
            {
                $unwind: {
                    path: '$orderId',
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: searchFilter },
            { $count: 'total' }
        ]);

        const total = totalDocuments[0]?.total || 0;

        // Fetch paginated data
        const ratingsData = await SUPPLEMENT_ORDER_RATING_MODEL.aggregate([
            { $match: matchCondition },
            {
                $lookup: {
                    from: 'SupplementSeller',
                    localField: 'supplementSellerId',
                    foreignField: '_id',
                    as: 'supplementSellerId'
                }
            },
            {
                $unwind: {
                    path: '$supplementSellerId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'User',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userId'
                }
            },
            {
                $unwind: {
                    path: '$userId',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'supplementorders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'orderId'
                }
            },
            {
                $unwind: {
                    path: '$orderId',
                    preserveNullAndEmptyArrays: true
                }
            },
            { $match: searchFilter },
            {
                $lookup: {
                    from: 'Supplement',
                    localField: 'itemRatings.itemId',
                    foreignField: '_id',
                    as: 'itemRatingsDetails'
                }
            },
            {
                $addFields: {
                    itemRatings: {
                        $map: {
                            input: '$itemRatings',
                            as: 'item',
                            in: {
                                $mergeObjects: [
                                    '$$item',
                                    {
                                        itemId: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$itemRatingsDetails',
                                                        as: 'details',
                                                        cond: { $eq: ['$$details._id', '$$item.itemId'] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    itemRatingsDetails: 0
                }
            },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        const response = {
            data: ratingsData,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        };

        return sendSuccessResponse(res, response, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const getById = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const supplementSeller = req.tokenData;
        const rating = await SUPPLEMENT_ORDER_RATING_MODEL.findOne({ _id: ratingId, supplementSellerId: supplementSeller._id })
            .populate({
                path: 'itemRatings.itemId',
                select: "name type brandName averageRating images"
            });
        if (!rating) {
            return sendErrorResponse(res, 'Rating not found', HttpStatus.NOT_FOUND);
        }

        return sendSuccessResponse(res, rating, 'Rating deleted', HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

export const deleteRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const supplementSeller = req.tokenData;
        const rating = await SUPPLEMENT_ORDER_RATING_MODEL.findOne({ _id: ratingId, supplementSellerId: supplementSeller._id });
        if (!rating) {
            return sendErrorResponse(res, 'Rating not found', HttpStatus.NOT_FOUND);
        }
        await SUPPLEMENT_ORDER_RATING_MODEL.findByIdAndUpdate(rating._id, { isDeleted: true });

        return sendSuccessResponse(res, {}, 'Rating deleted', HttpStatus.OK);
    } catch (error) {
        console.log(error);
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
};

