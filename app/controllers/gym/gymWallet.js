import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { transactionType } from '../../constants/wallet.constants';
import { GymWalletModel } from '../../models/gym/gymWallet.model';
import { GymTransactionModel } from '../../models/gym/gymTransaction.model';
const randomize = require('randomatic');

export const addBalance = async (req, res) => {
   try {
      let { amount } = req.body;
      const gymData = req?.gymData;
      let newBalance = Number(amount);
      let wallet = await commonService.findOne(GymWalletModel, {
         gymId: gymData?._id,
      });
      if (!wallet) {
         wallet = await commonService.create(GymWalletModel, {
            gymId: gymData?._id,
         });
      }
      let transactionId = await randomize('0', 9);
      transactionId = '#' + transactionId;
      const transaction = await commonService.create(GymTransactionModel, {
         amount,
         gymId: gymData?._id,
         transactionType: transactionType.credit,
         transactionId,
      });
      if (!transaction) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
      newBalance += wallet?.balance;
      let updatedWallet = await commonService.findOneAndUpdate(GymWalletModel, wallet._id, {
         balance: newBalance,
      });

      sendSuccessResponse(res, updatedWallet, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getBalance = async (req, res) => {
   try {
      let gymData = req.gymData;
      let wallet = await commonService.findOne(GymWalletModel, {
         gymId: gymData?._id,
      });
      if (!wallet) {
         let data =  {"balance": 0}
         return sendSuccessResponse(res,data, HttpStatus.SUCCESS);
      } else {
         sendSuccessResponse(res, wallet, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getTransactionsList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate } = req.query;
      let matchStage = {};
      let gymId = req?.gymData?._id;

      // Handle Date Range Filtering
      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }
      matchStage.gymId = gymId;
      const gym = await commonService.listAggregation({
         model: GymTransactionModel,
         page,
         limit,
         matchStage,
      });

      if (gym) {
         sendSuccessResponse(res, gym, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
