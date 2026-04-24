import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { error, success } from '../../responses/messages';

import mongoose from 'mongoose';
import * as commonService from '../../services/common/common.service';
import { SPONSOR_MODEL } from '../../models/admin/sponsor.model';
import { transactionType } from '../../constants/wallet.constants';
import { GymWalletModel } from '../../models/gym/gymWallet.model';
import { GYM_SPONSOR_MODEL } from '../../models/gym/gymSponsor.model';
import { GymTransactionModel } from '../../models/gym/gymTransaction.model';
const randomize = require('randomatic');

/****************************************
*************** SPRINT 6 ****************
*****************************************/

export const sponserBidController = async (req, res) => {
    try {
        let { amount } = req.body
        if (!amount) {
            return sendErrorResponse(res, "Please enter amount greater and equal to 1", HttpStatus.BAD_REQUEST);
        }

       let wallet = await GymWalletModel.findOne({ gymId: req.gymData?._id }).lean();
        if (!wallet) {
            return sendErrorResponse(res, "Please add funds to your wallet first.", HttpStatus.BAD_REQUEST);
        }

        if (amount > wallet.balance) {
            return sendErrorResponse(res, `You can't place bid now as you have ${wallet.balance} KD in wallet.`, HttpStatus.BAD_REQUEST);
        }

        const gymBiddingResp = await commonService.findOne(SPONSOR_MODEL, { service: "Gym" });
        if ((gymBiddingResp?.minimumBid || 1) > amount) {
            return sendErrorResponse(res, `Please enter amount greater and equal to ${(gymBiddingResp?.minimumBid || 1)}.`, HttpStatus.BAD_REQUEST);
        }

        const activeBidRes = await GYM_SPONSOR_MODEL.findOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true });
        if (!!activeBidRes?.amount && amount > activeBidRes?.spendPerDayAmount) {
            return sendErrorResponse(res, `You can't create as your daily bid limit is ${activeBidRes?.spendPerDayAmount}.`, HttpStatus.BAD_REQUEST);
        }

        let transactionId = '#' + randomize('0', 9);
        const transaction = await commonService.create(GymTransactionModel, {
            amount,
            gymId: req.gymData?._id,
            transactionType: transactionType.debit,
            transactionId,
            paymentFor: 2,
            createdAt: new Date().getTime()
        });

        if (!transaction) {
            return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
        }

        wallet.balance = wallet.balance - amount;
        let updatedWallet = await GymWalletModel.findByIdAndUpdate(
            wallet._id,
            {$set:wallet},
            {new:true}
        )

        console.log("updated wallet wallet",updatedWallet)


        await GYM_SPONSOR_MODEL.updateOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true }, { $set: { isActive: false } });
        let gym = await GYM_SPONSOR_MODEL.create({ amount, gymId: new mongoose.Types.ObjectId(req.gymData?._id), createdAt: new Date().getTime(), spendPerDayAmount: activeBidRes?.spendPerDayAmount || 0 });
        return sendSuccessResponse(res, gym, success.SUCCESS, HttpStatus.OK)
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

        let gym = await GYM_SPONSOR_MODEL.aggregate([
            {
                $match: {
                    isActive: true,
                    isBlocked: false
                }
            },
            {
                $lookup: {
                    from: 'Gym',
                    localField: 'gymId',
                    foreignField: '_id',
                    as: 'gymId'
                }
            },
            {
                $unwind: '$gymId'
            },
            {
                $match: {
                    'gymId.isBlocked': false
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

        const total = gym[0]?.total?.[0]?.count || 0;
        const list = gym[0]?.list || [];

        return sendSuccessResponse(res, { total, list }, success.SUCCESS, HttpStatus.OK);
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserListHistoryByGymController = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        let skipIndex = (page - 1) * limit;
        let total = await GYM_SPONSOR_MODEL.find({ gymId: new mongoose.Types.ObjectId(req.gymData?._id) }).countDocuments();
        let gym = await GYM_SPONSOR_MODEL.find({ gymId: new mongoose.Types.ObjectId(req.gymData?._id) }).skip(skipIndex).limit(limit).sort({ createdAt: -1 });
        return sendSuccessResponse(res, { total, list: gym }, success.SUCCESS, HttpStatus.OK)
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

        let wallet = await commonService.findOne(GymWalletModel ,{
            gymId: new mongoose.Types.ObjectId(req.gymData?._id),
        });

        if (!wallet) {
            return sendErrorResponse(res, "Please add funds to your wallet first.", HttpStatus.BAD_REQUEST);
        }

        if (amount > wallet.balance) {
            return sendErrorResponse(res, `You can't set per day spend limit as you have ${wallet.balance} KD in wallet.`, HttpStatus.BAD_REQUEST);
        }

        const activeBidRes = await GYM_SPONSOR_MODEL.findOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true });
        if (!activeBidRes) {
            return sendErrorResponse(res, `Please create a bid first to set the spending limit per day.`, HttpStatus.BAD_REQUEST);
        }

        if (!!activeBidRes?.amount && activeBidRes?.amount > amount) {
            return sendErrorResponse(res, `You can't add your daily bid limit is ${amount} as you already placed bid for ${activeBidRes?.amount}.`, HttpStatus.BAD_REQUEST);
        }

        let resp = await GYM_SPONSOR_MODEL.updateOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true }, { $set: { spendPerDayAmount: amount } });
        return sendSuccessResponse(res, resp, success.UPDATED, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserGetPerDayController = async (req, res) => {
    try {
        let resp = await GYM_SPONSOR_MODEL.findOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true });
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserStopBidController = async (req, res) => {
    try {
        const { isBlocked } = req.body
        let isExit = await GYM_SPONSOR_MODEL.findOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id) });
        if (!isExit) {
            return sendErrorResponse(res, "Please create atleast a bid first", HttpStatus.BAD_REQUEST);
        }

        let resp = await GYM_SPONSOR_MODEL.findOneAndUpdate({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true }, { $set: { isBlocked } });
        return sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}

export const sponserActiveBidController = async (req, res) => {
    try {
        const activeBidRes = await GYM_SPONSOR_MODEL.findOne({ gymId: new mongoose.Types.ObjectId(req.gymData?._id), isActive: true });
        return sendSuccessResponse(res, activeBidRes, success.SUCCESS, HttpStatus.OK)
    } catch (error) {
        return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
    }
}