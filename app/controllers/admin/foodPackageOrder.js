import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import PackageOrderModel from '../../models/user/packageOrder.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
const crypto = require('crypto');

/****************************************
 *************** SPRINT 6 ****************
 *****************************************/
export const getFoodPackageOrders = async (req, res) => {
   try {
     let { search = '', page = 1, limit = 10, from, to, expired } = req.query;
     limit = parseInt(limit);
     page = parseInt(page);
     let skipIndex = (page - 1) * limit;
     let params = { isDeleted: false };
 
     if (search) {
       params = Object.assign(params, {
         $or: [
           { name: { $regex: '.*' + search + '.*', $options: 'i' } },
           { packageId: { $regex: '.*' + search + '.*', $options: 'i' } },
           { orderId: { $regex: '.*' + search + '.*', $options: 'i' } },
           { 'userId.fullName': { $regex: '.*' + search + '.*', $options: 'i' } },
           { 'restaurentCartId.restId.resName': { $regex: '.*' + search + '.*', $options: 'i' } } 
         ],
       });
     }
 
     if (from && to) {
       const fromTimestamp = Number(from);
       const toTimestamp = Number(to);
       params.createdAt = { $gte: fromTimestamp, $lte: toTimestamp };
     } else if (from) {
       const fromTimestamp = Number(from);
       params.createdAt = { $gte: fromTimestamp };
     }
 
     if (expired !== undefined) {
       params.expired = expired === 'true';
     }
 
     let count = await PackageOrderModel.countDocuments(params);

     //orderModel
     let list = await PackageOrderModel.find(params).sort({ createdAt: -1 }).skip(skipIndex).limit(limit)
     .populate([
      { path: 'userId', select: 'fullName' },
      { path: 'addressId' },
      {
        path: 'restaurentCartId',
        populate: [
          { path: 'restId', select: 'resName' },
          { path: 'packageId' }
        ]
      }
    ]);

    list = list.map((order) => {
      if (order.dates && order.dates.length > 0) {
        const lastDate = order.dates[order.dates.length - 1];
        return { ...order.toObject(), endDate: lastDate.date };
      }
      return { ...order.toObject(), endDate: null };
    });

     return sendSuccessResponse(res, {count:count , list: list }, 'food Package Order List', HttpStatus.OK);
   } catch (error) {
     return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
 };
 
 