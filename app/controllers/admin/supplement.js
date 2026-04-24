import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { SupplementSellerModel } from '../../models/supplement/supplementSeller.model';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import mongoose from 'mongoose';
import SupplementOrderDeliveryModel from '../../models/delivery/supplementDeliveryModel';
import { SupplementModel } from '../../models/supplement/supplement';
import { SupplementPkgModel } from '../../models/supplement/supplementPkg.model';

export const getPendingSupplementSellers = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10, from, to, sellerNameSort = -1 } = req.query;
      //sellerNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [
               { name: { $regex: '.*' + search + '.*', $options: 'i' } },
               { email: { $regex: '.*' + search + '.*', $options: 'i' } },
               { mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' } },
               { ownerName: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
         });
      }
      if (from && to && from.length > 0 && to.length > 0) {
         const fromTimestamp = Number(from);
         const toTimestamp = Number(to);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      } else if (from && from.length > 0) {
         const fromTimestamp = Number(from);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
            },
         });
      }

      let count = await SupplementSellerModel.countDocuments({ ...params, supplementStatus: 0 });
      const supplementSellersList = await SupplementSellerModel.find({ ...params, supplementStatus: 0 })
         .sort({ name: sellerNameSort, createdAt: -1 })
         .skip(skipIndex)
         .limit(limit)
         .lean();

      if (supplementSellersList) {
         sendSuccessResponse(res, { count: count, list: supplementSellersList }, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getApprovedSupplementSellers = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10, from, to, sellerNameSort = -1 } = req.query;
      //sellerNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [
               { name: { $regex: '.*' + search + '.*', $options: 'i' } },
               { email: { $regex: '.*' + search + '.*', $options: 'i' } },
               { mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' } },
               { ownerName: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
         });
      }
      if (from && to && from.length > 0 && to.length > 0) {
         const fromTimestamp = Number(from);
         const toTimestamp = Number(to);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      } else if (from && from.length > 0) {
         const fromTimestamp = Number(from);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
            },
         });
      }

      let count = await SupplementSellerModel.countDocuments({ ...params, supplementStatus: 1 });
      const supplementSellersList = await SupplementSellerModel.find({ ...params, supplementStatus: 1 })
         .sort({ name: sellerNameSort, createdAt: -1 })
         .skip(skipIndex)
         .limit(limit)
         .lean();

      if (supplementSellersList) {
         sendSuccessResponse(res, { count: count, list: supplementSellersList }, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getRejectedSupplementSellers = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10, from, to, sellerNameSort = -1 } = req.query;
      //sellerNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [
               { name: { $regex: '.*' + search + '.*', $options: 'i' } },
               { email: { $regex: '.*' + search + '.*', $options: 'i' } },
               { mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' } },
               { ownerName: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
         });
      }
      if (from && to && from.length > 0 && to.length > 0) {
         const fromTimestamp = Number(from);
         const toTimestamp = Number(to);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      } else if (from && from.length > 0) {
         const fromTimestamp = Number(from);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
            },
         });
      }

      let count = await SupplementSellerModel.countDocuments({ ...params, supplementStatus: 2 });
      const supplementSellersList = await SupplementSellerModel.find({ ...params, supplementStatus: 2 })
         .sort({ name: sellerNameSort, createdAt: -1 })
         .skip(skipIndex)
         .limit(limit)
         .lean();

      if (supplementSellersList) {
         sendSuccessResponse(res, { count: count, list: supplementSellersList }, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateStatus = async (req, res) => {
   try {
      const { id, status, rejected_reason } = req.body;
      const checkUser = await commonService.findById(SupplementSellerModel, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         status: status,
         rejected_reason: rejected_reason ? rejected_reason : '',
      };

      if (status === 2) {
         data.isBankDetailsUpdated = false;
         data.isDocumentsUploaded = false;
      }
      const updated = await commonService.findOneAndUpdate(SupplementSellerModel, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const blockUnblockSeller = async (req, res) => {
   try {
      const { id, isBlocked } = req.body;
      const checkUser = await commonService.findById(SupplementSellerModel, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const data = {
         isBlocked: isBlocked,
      };
      const updated = await commonService.findOneAndUpdate(SupplementSellerModel, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const acceptReject = async (req, res) => {
   try {
      const { _id, isStatus } = req.body;

      const supplementSeller = await commonService.findById(SupplementSellerModel, { _id: _id }, {});

      if (!supplementSeller) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const currentTime = new Date();

      if (isStatus == 1) {
         const data = {
            supplementStatus: isStatus,
            rejected_reason: {
               reason: "",
               rejectedBy: ""
            },
            updatedAt: currentTime
         }
         const updated = await commonService.findOneAndUpdate(SupplementSellerModel, supplementSeller._id, data);
         if (updated) {
            return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
         }
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }
      else if (isStatus == 2) {
         const { reason, rejectionIssue } = req.body;
         const data = {
            supplementStatus: isStatus,
            rejected_reason: {
               reason: reason,
               rejectedBy: rejectionIssue
            },
            isDocumentsUploaded: false,
            // update status according where we wanted to redirect - 
            updatedAt: currentTime
         }

         const updated = await commonService.findOneAndUpdate(SupplementSellerModel, supplementSeller._id, data)
         if (updated) {
            return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
         }
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
      }

   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}


export const orderList = async (req, res) => {
   try {
      const { status, orderType, startDate, endDate, search, deliveryOption, sellerId, page = 1, limit = 10 } = req.query;

      const matchStage = {};

      if (status) {
         matchStage.status = Number(status);
      }

      if (deliveryOption) {
         matchStage.deliveryOption = Number(deliveryOption);
      }

      if (orderType) {
         switch (orderType) {
            case 'ongoing':
               matchStage.status = { $in: [1, 2, 3] };
               break;
            case 'past':
               matchStage.status = { $in: [4, 5] };
               break;
            default:
               break;
         }
      }

      if (startDate && endDate) {
         matchStage.createdAt = {
            $gte: Number(new Date(Number(startDate)).getTime()),
            $lte: Number(new Date(Number(endDate)).getTime()),
         };
      }

      const searchFilter = {};

      if (search) {
         searchFilter.$or = [
            { orderId: { $regex: search, $options: 'i' } },
            { 'userId.fullName': { $regex: search, $options: 'i' } },
         ];
      }

      const skip = (page - 1) * limit;

      const aggregationPipeline = [
         { $match: matchStage },
         {
            $lookup: {
               from: 'User',
               localField: 'userId',
               foreignField: '_id',
               as: 'userId',
            },
         },
         { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
         { $match: searchFilter },
         {
            $lookup: {
               from: 'supplementCarts',
               localField: 'supplementCartId',
               foreignField: '_id',
               as: 'supplementCartId',
            },
         },
         { $unwind: { path: '$supplementCartId', preserveNullAndEmptyArrays: true } },

         ...(sellerId ? [{
            $match: {
               'supplementCartId.supplementSeller': new mongoose.Types.ObjectId(sellerId),
            },
         }] : []),

         {
            $lookup: {
               from: 'SupplementSeller',
               localField: 'supplementCartId.supplementSeller',
               foreignField: '_id',
               as: 'supplementCartId.supplementSeller',
            },
         },
         { $unwind: { path: '$supplementCartId.supplementSeller', preserveNullAndEmptyArrays: true } },
         // {
         //    $lookup: {
         //       from: 'Supplement',
         //       localField: 'supplementCartId.items.itemId',
         //       foreignField: '_id',
         //       as: 'supplementCartId.itemsDetails',
         //    },
         // },

         // {
         //    $lookup: {
         //       from: 'SupplementPkg',
         //       localField: 'supplementCartId.bundles.bundleId',
         //       foreignField: '_id',
         //       as: 'supplementCartId.bundlesDetails',
         //    },
         // },

         // { $unwind: { path: '$supplementCartId.bundlesDetails', preserveNullAndEmptyArrays: true } },

         // {
         //    $lookup: {
         //       from: 'Supplement',
         //       localField: 'supplementCartId.bundlesDetails.products._id',
         //       foreignField: '_id',
         //       as: 'supplementCartId.bundlesDetails.productsDetails',
         //    },
         // },

         {
            $lookup: {
               from: 'addresses',
               localField: 'addressId',
               foreignField: '_id',
               as: 'addressId',
            },
         },
         { $unwind: { path: '$addressId', preserveNullAndEmptyArrays: true } },
         {
            $lookup: {
               from: 'SupplementOrderRating',
               localField: 'orderRating',
               foreignField: '_id',
               as: 'orderRating',
            },
         },
         { $unwind: { path: '$orderRating', preserveNullAndEmptyArrays: true } },
         {
            $lookup: {
               from: 'Supplement',
               localField: 'orderRating.itemRatings.itemId',
               foreignField: '_id',
               as: 'ratedItemDetails'
            }
         },
         {
            $addFields: {
               'orderRating.itemRatings': {
                  $map: {
                     input: '$orderRating.itemRatings',
                     as: 'item',
                     in: {
                        $mergeObjects: [
                           '$$item',
                           {
                              $arrayElemAt: ['$ratedItemDetails', 0]  // Take the first element of the lookup result
                           }
                        ]
                     }
                  }
               }
            }
         },
         { $sort: { updatedAt: -1 } },

         { $skip: skip },
         { $limit: Number(limit) },
      ];

      const orders = await SupplementOrderModel.aggregate(aggregationPipeline);

      let items = [];
      let bundles = [];

      orders.forEach(order => {
         order.supplementCartId.items.forEach(item => {
            items.push({
               _id: item._id,
               itemId: item.itemId,
               stockId: item.stockId,
               quantity: item.quantity,
               amount: item.amount,
               orderId: order._id
            });
         });

         order.supplementCartId.bundles.forEach(bundle => {
            bundles.push({
               _id: bundle._id,
               bundleId: bundle.bundleId,
               quantity: bundle.quantity,
               amount: bundle.amount,
               orderId: order._id
            });
         });
      });

      const updatedItems = await Promise.all(items.map(async (item) => {
         const supplementItem = await SupplementModel.findById(item.itemId);
         if (supplementItem) {
            const stock = supplementItem.stock.find(stock => stock._id.toString() === item.stockId.toString());
            if (stock) {
               return {
                  ...item,
                  itemData: {
                     ...supplementItem._doc,
                     stockData: stock
                  }
               };
            }
         }
         return item;
      }));

      const updatedBundles = await Promise.all(bundles.map(async (bundle) => {
         const supplementPkg = await SupplementPkgModel.findById(bundle.bundleId);
         if (supplementPkg) {
            const updatedProducts = await Promise.all(supplementPkg.products.map(async (product) => {
               const supplementItem = await SupplementModel.findById(product._id);
               if (supplementItem) {
                  const stock = supplementItem.stock.find(stock => stock._id.toString() === product.stockId.toString());
                  if (stock) {
                     return {
                        ...supplementItem.toObject(),
                        stockData: stock
                     };
                  }
               }
               return product;
            }));

            return {
               ...bundle,
               bundleData: {
                  ...supplementPkg.toObject(),
                  products: updatedProducts
               }
            };
         }
         return bundle;
      }));

      const updatedTotalOrders = orders.map(order => {
         const items = updatedItems.filter(item => item.orderId.toString() === order._id.toString());
         const bundles = updatedBundles.filter(bundle => bundle.orderId.toString() === order._id.toString());

         return {
            ...order,
            items,
            bundles
         };
      });

      const totalOrdersPipeline = [
         { $match: matchStage },
         {
            $lookup: {
               from: 'User',
               localField: 'userId',
               foreignField: '_id',
               as: 'userId',
            },
         },
         { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
         { $match: searchFilter },
         {
            $lookup: {
               from: 'supplementCarts',
               localField: 'supplementCartId',
               foreignField: '_id',
               as: 'supplementCartId',
            },
         },
         { $unwind: { path: '$supplementCartId', preserveNullAndEmptyArrays: true } },
         ...(sellerId ? [{
            $match: {
               'supplementCartId.supplementSeller': new mongoose.Types.ObjectId(sellerId),
            },
         }] : []),
      ];

      const totalOrders = await SupplementOrderModel.aggregate([
         ...totalOrdersPipeline,
         { $count: 'total' },
      ]);

      const totalOrdersCount = totalOrders[0]?.total || 0;

      sendSuccessResponse(res, {
         orders: updatedTotalOrders,
         totalOrdersCount,
         totalPages: Math.ceil(totalOrdersCount / limit),
         currentPage: Number(page),
      }, "Orders fetched successfully");
   } catch (error) {
      sendErrorResponse(res, error.message);
   }
};

export const getDriverDetails = async (req, res) => {
   try {
      const { id } = req.params;
      const delivery = await SupplementOrderDeliveryModel.findOne({ orderId: id, isPickUp: true }).populate("deliveryBoyId");
      if (!delivery) {
         return sendErrorResponse(res, "Delivery not found");
      }
      return sendSuccessResponse(res, delivery, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};