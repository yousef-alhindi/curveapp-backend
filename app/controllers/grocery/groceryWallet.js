import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { GroceryWalletModel } from '../../models/grocery/groceryWallet.model';
import { GroceryTransactionModel } from '../../models/grocery/groceryTransaction.model';
import { transactionType } from '../../constants/wallet.constants';
const randomize = require('randomatic');

export const addBalance = async (req, res) => {
   try {
      let { amount } = req.body;
      const restaurantData = req?.restaurantData;
      let newBalance = Number(amount);
      let wallet = await commonService.findOne(GroceryWalletModel, {
         groceryId: restaurantData?._id,
      });
      if (!wallet) {
         wallet = await commonService.create(GroceryWalletModel, {
            groceryId: restaurantData?._id,
         });
      }
      let transactionId = randomize('0', 9);
      transactionId = '#' + transactionId;
      const transaction = await commonService.create(GroceryTransactionModel, {
         amount,
         groceryId: restaurantData?._id,
         transactionType: transactionType.credit,
         transactionId,
      });
      if (!transaction) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
      newBalance += wallet?.balance;
      let updatedWallet = await commonService.findOneAndUpdate(GroceryWalletModel, wallet._id, {
         balance: newBalance,
      });

      sendSuccessResponse(res, updatedWallet, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getBalance = async (req, res) => {
   try {
      let restaurantData = req.restaurantData;
      let wallet = await commonService.findOne(GroceryWalletModel, {
         groceryId: restaurantData?._id,
      });
      if (!wallet) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
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
      let resId = req?.restaurantData?._id;

      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }
      matchStage.groceryId = resId;
      const resp = await commonService.listAggregation({
         model: GroceryTransactionModel,
         page,
         limit,
         matchStage,
      });

      if (resp) {
         sendSuccessResponse(res, resp, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};