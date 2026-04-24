import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { transactionType } from '../../constants/wallet.constants';
import { SupplementWalletModel } from '../../models/supplement/supplementWallet.model';
import { SupplementTransactionModel } from '../../models/supplement/supplementTransaction.model';
const randomize = require('randomatic');

export const addBalance = async (req, res) => {
   try {
      let { amount } = req.body;
      const supplementData = req?.supplementData;
      let newBalance = Number(amount);
      let wallet = await commonService.findOne(SupplementWalletModel, {
         supplementId: supplementData?._id,
      });
      if (!wallet) {
         wallet = await commonService.create(SupplementWalletModel, {
            supplementId: supplementData?._id,
         });
      }
      let transactionId = await randomize('0', 9);
      transactionId = '#' + transactionId;
      const transaction = await commonService.create(SupplementTransactionModel, {
         amount,
         supplementId: supplementData?._id,
         transactionType: transactionType.credit,
         transactionId,
      });
      if (!transaction) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
      newBalance += wallet?.balance;
      let updatedWallet = await commonService.findOneAndUpdate(SupplementWalletModel, wallet._id, {
         balance: newBalance,
      });

      sendSuccessResponse(res, updatedWallet, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getBalance = async (req, res) => {
   try {
      let supplementData = req.supplementData;
      let wallet = await commonService.findOne(SupplementWalletModel, {
         supplementId: supplementData?._id,
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
      let supplementId = req?.supplementData?._id;

      // Handle Date Range Filtering
      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }
      matchStage.supplementId = supplementId;
      const supplement = await commonService.listAggregation({
         model: SupplementTransactionModel,
         page,
         limit,
         matchStage,
      });

      if (supplement) {
         sendSuccessResponse(res, supplement, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
