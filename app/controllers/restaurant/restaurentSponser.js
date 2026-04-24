import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { error, success } from '../../responses/messages';
import { RESTAURENT_SPONSOR_MODEL } from '../../models/restaurant/restaurentSponsor.model';
import { RestaurantWalletModel } from '../../models/restaurant/restaurantWallet.model';
import { RestaurantTransactionModel } from '../../models/restaurant/restaurantTransaction.model';

import mongoose from 'mongoose';
import * as commonService from '../../services/common/common.service';
import { SPONSOR_MODEL } from '../../models/admin/sponsor.model';
import { transactionType } from '../../constants/wallet.constants';
const randomize = require('randomatic');

/****************************************
*************** SPRINT 3 ****************
***************body**************************/

export const sponserBidController = async (req, res) => {
    try {
        let { amount } = req.body
        if (!amount) {
            return sendErrorResponse(res, "Please enter amount greater and equal to 1", HttpStatus.BAD_REQUEST);
        }

        let wallet = await commonService.findOne(RestaurantWalletModel, {
            restaurantId: new mongoose.Types.ObjectId(req.restaurantData?._id),
        });

        if (!wallet) {
            return sendErrorResponse(res, "Please add funds to your wallet first.", HttpStatus.BAD_REQUEST);
        }

        if (amount > wallet.balance) {
            return sendErrorResponse(res, `You can't place bid now as you have ${wallet.balance} KD in wallet.`, HttpStatus.BAD_REQUEST);
        }

        const restaurantBiddingResp = await commonService.findOne(SPONSOR_MODEL, { service: "Food" });
        if ((restaurantBiddingResp?.minimumBid || 1) > amount) {
            return sendErrorResponse(res, `Please enter amount greater and equal to ${(restaurantBiddingResp?.minimumBid || 1)}.`, HttpStatus.BAD_REQUEST);
        }

        const activeBidRes = await RESTAURENT_SPONSOR_MODEL.findOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true });
        if (!!activeBidRes?.amount && amount > activeBidRes?.spendPerDayAmount) {
            return sendErrorResponse(res, `You can't create as your daily bid limit is ${activeBidRes?.spendPerDayAmount}.`, HttpStatus.BAD_REQUEST);
        }

        let transactionId = '#' + randomize('0', 9);
        const transaction = await commonService.create(RestaurantTransactionModel, {
            amount,
            restaurantId: req.restaurantData?._id,
            transactionType: transactionType.debit,
            transactionId,
            paymentFor: 2,
            createdAt: new Date().getTime()
        });

        if (!transaction) {
            return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
        }

        await RESTAURENT_SPONSOR_MODEL.updateOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true }, { $set: { isActive: false } });
        let resp = await RESTAURENT_SPONSOR_MODEL.create({ amount, restId: new mongoose.Types.ObjectId(req.restaurantData?._id), createdAt: new Date().getTime(), spendPerDayAmount: activeBidRes?.spendPerDayAmount || 0 });
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserListController = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        let skipIndex = (page - 1) * limit;

        let resp = await RESTAURENT_SPONSOR_MODEL.aggregate([
            {
                $match: {
                    isActive: true,
                    isBlocked: false
                }
            },
            {
                $lookup: {
                    from: 'Restaurant',
                    localField: 'restId',
                    foreignField: '_id',
                    as: 'restId'
                }
            },
            {
                $unwind: '$restId'
            },
            {
                $match: {
                    'restId.isBlocked': false
                }
            },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    list: [
                        { $sort: { amount: -1 } },
                        { $skip: skipIndex },
                        { $limit: limit }
                    ]
                }
            }
        ]);

        const total = resp[0]?.total?.[0]?.count || 0;
        const list = resp[0]?.list || [];

        return sendSuccessResponse(res, { total, list }, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserListHistoryByRestaurentController = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        let skipIndex = (page - 1) * limit;
        let total = await RESTAURENT_SPONSOR_MODEL.find({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id) }).countDocuments();
        let resp = await RESTAURENT_SPONSOR_MODEL.find({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id) }).skip(skipIndex).limit(limit).sort({ createdAt: -1 });
        return sendSuccessResponse(res, { total, list: resp }, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserSpentPerDayController = async (req, res) => {
    try {
        const { amount } = req.body
        if (!amount) {
            return sendErrorResponse(res, "Please enter amount greater and equal to 1", HttpStatus.BAD_REQUEST);
        }

        let wallet = await commonService.findOne(RestaurantWalletModel, {
            restaurantId: new mongoose.Types.ObjectId(req.restaurantData?._id),
        });

        if (!wallet) {
            return sendErrorResponse(res, "Please add funds to your wallet first.", HttpStatus.BAD_REQUEST);
        }

        if (amount > wallet.balance) {
            return sendErrorResponse(res, `You can't set per day spend limit as you have ${wallet.balance} KD in wallet.`, HttpStatus.BAD_REQUEST);
        }

        const activeBidRes = await RESTAURENT_SPONSOR_MODEL.findOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true });
        if (!activeBidRes) {
            return sendErrorResponse(res, `Please create a bid first to set the spending limit per day.`, HttpStatus.BAD_REQUEST);
        }

        if (!!activeBidRes?.amount && activeBidRes?.amount > amount) {
            return sendErrorResponse(res, `You can't add your daily bid limit is ${amount} as you already placed bid for ${activeBidRes?.amount}.`, HttpStatus.BAD_REQUEST);
        }

        let resp = await RESTAURENT_SPONSOR_MODEL.updateOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true }, { $set: { spendPerDayAmount: amount } });
        return sendSuccessResponse(res, resp, success.UPDATED, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserGetPerDayController = async (req, res) => {
    try {
        let resp = await RESTAURENT_SPONSOR_MODEL.findOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true });
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserStopBidController = async (req, res) => {
    try {
        const { isBlocked } = req.body
        let isExit = await RESTAURENT_SPONSOR_MODEL.findOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id) });
        if (!isExit) {
            return sendErrorResponse(res, "Please create atleast a bid first", HttpStatus.BAD_REQUEST);
        }

        let resp = await RESTAURENT_SPONSOR_MODEL.findOneAndUpdate({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true }, { $set: { isBlocked } });
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserActiveBidController = async (req, res) => {
    try {
        const activeBidRes = await RESTAURENT_SPONSOR_MODEL.findOne({ restId: new mongoose.Types.ObjectId(req.restaurantData?._id), isActive: true });
        return sendSuccessResponse(res, activeBidRes, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}