import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { RestaurantTransactionModel } from '../../models/restaurant/restaurantTransaction.model';
import { RestaurantModel } from '../../models/restaurant/restaurant.model';
import { RestaurantWalletModel } from '../../models/restaurant/restaurantWallet.model';
import OrderModel from '../../models/user/order.model';
import HttpStatus from 'http-status-codes';
import mongoose from 'mongoose';
import { customPaginate } from '../../services/common/customPagination.service';
import SupplementOrderModel from '../../models/supplement/supplementOrder.model';
import GymSubscriptions from '../../models/gym/gymSubscriptions';

export const getAllResturantPaymnetHistory = async (req, res) => {
   try {
      let { restuarantType, fromDate, toDate, search, page = 1, pageSize = 10 } = req.query;
      let query = {
         status: 4,
         isDeleted: false,
         ...(search && search.indexOf('#') != -1 ? { $or: [{ paymentId: search }] } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      };
      const totalCounts = await OrderModel.countDocuments(query);
      const paymentRes = await OrderModel.find(query)
         .populate({
            path: 'userId',
            select: 'fullName',
            ...(search ? { match: { fullName: { $regex: search, $options: 'i' } } } : {}),
         })
         .populate({
            path: 'restaurentCartId',
            select: 'restId',
            populate: {
               path: 'restId',
               select: 'resName profileType',
               ...(restuarantType ? { match: { profileType: Number(restuarantType) } } : {}), // Match the profileType if provided
            },
         })
         .sort({ createdAt: -1 });

      // Filter orders where restaurentCartId or restaurentCartId.restId is null
      let filteredOrders = paymentRes.filter(order => {
         return order.restaurentCartId != null;
      });
      filteredOrders = filteredOrders.filter(order => {
         return order.restaurentCartId.restId != null;
      });
      const result = {
         page: page,
         pageSize: pageSize,
         totalCount: filteredOrders.length,
         paymentData: customPaginate(filteredOrders, page, pageSize),
      };
      if (paymentRes.length > 0) {
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No order found', HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAllSupplementPaymnetHistory = async (req, res) => {
   try {
      let { fromDate, toDate, search, page = 1, pageSize = 10 } = req.query;
      let query = {
         status: 4,
         isDeleted: false,
         ...(search && search.indexOf('#') != -1 ? { $or: [{ paymentId: search }] } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      };
      const totalCounts = await SupplementOrderModel.countDocuments(query);
      const paymentRes = await SupplementOrderModel.find(query)
         .populate({
            path: 'userId',
            select: 'fullName',
            ...(search ? { match: { fullName: { $regex: search, $options: 'i' } } } : {}),
         })
         .populate({
            path: 'supplementCartId',
            select: 'supplementSeller',
            populate: {
               path: 'supplementSeller',
               select: 'name profileType',
            },
         })
         .sort({ createdAt: -1 });

      // Filter orders where restaurentCartId or restaurentCartId.restId is null
      let filteredOrders = paymentRes.filter(order => {
         return order.supplementCartId != null;
      });
      filteredOrders = filteredOrders.filter(order => {
         return order.supplementCartId.supplementSeller != null;
      });
      const result = {
         page: page,
         pageSize: pageSize,
         totalCount: filteredOrders.length,
         paymentData: customPaginate(filteredOrders, page, pageSize),
      };
      if (paymentRes.length > 0) {
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No order found', HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getGymPaymentHistory = async (req, res) => {
   try {
      const { search, page = 1, limit = 10, startDate, endDate } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const searchQuery = {}
      if (search) {
         searchQuery.$or = [
            { paymentId: { $regex: search, $options: 'i' } },
            { "gymDetails.name": { $regex: search, $options: 'i' } }
         ]
      }
      const matchStage = {};

      if (startDate && endDate) {
         matchStage.createdAt = {
            $gte: Number(startDate),
            $lte: Number(endDate),
         };
      }

      const subscriptionsPipeline = [
         { $match: matchStage },
         {
            $lookup: {
               from: "Gym",
               localField: "gymId",
               foreignField: "_id",
               as: "gymDetails"
            }
         },
         { $unwind: "$gymDetails" },
         {
            $match: searchQuery
         },
         {
            $project: {
               paymentId: 1,
               gymName: "$gymDetails.name",
               amountPaid: 1,
               discount: 1,
               transactionTime: "$createdAt"
            }
         },
         { $sort: { transactionTime: -1 } },
         { $skip: skip },
         { $limit: parseInt(limit) }
      ];

      const countPipeline = [
         { $match: matchStage },
         {
            $lookup: {
               from: "Gym",
               localField: "gymId",
               foreignField: "_id",
               as: "gymDetails"
            }
         },
         { $unwind: "$gymDetails" },
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

export const getAllOfferEnrollmentPaymnetHistory = async (req, res) => {
   try {
      let {
         restuarantType,
         fromDate,
         toDate,
         search,
         page = 1,
         pageSize = 10,
         paymentFor,
      } = req.query;
      // paymentFor === 0 that means both PaymentFor 3 and 4
      page = Number(page) || 1;
      pageSize = Number(pageSize) || 10;
      paymentFor = Number(paymentFor) || 0;
      let query = {
         paymentFor: paymentFor === 0 ? { $in: [3, 4] } : Number(paymentFor),
         isDeleted: false,
         ...(search && search.indexOf('#') != -1 ? { $or: [{ transactionId: search }] } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      };
      const totalCounts = await RestaurantTransactionModel.countDocuments(query);
      const sponsorResNew = await RestaurantTransactionModel.aggregate([
         {
            $match: {
               paymentFor: paymentFor === 0 ? { $in: [3, 4] } : Number(paymentFor),
               isDeleted: false,
               ...(search && search.indexOf('#') != -1 ? { $or: [{ transactionId: search }] } : {}),
               ...(fromDate && toDate
                  ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
                  : {}),
            },
         },
         {
            $lookup: {
               from: 'Restaurant',
               localField: 'restaurantId',
               foreignField: '_id',
               as: 'restaurantId',
            }
         },
         {
            $match: {
               ...(restuarantType ? { "restaurantId.profileType": Number(restuarantType) } : {}),
               ...(search && search.indexOf('#') == -1 ? { "restaurantId.resName": { $regex: search, $options: 'i' } } : {})

            }
         },
         {
            $skip: (page - 1) * pageSize
         },
         {
            $limit: pageSize
         },
         {
            $sort: { createdAt: -1 }
         },
         {
            $project: {
               userId: 1,
               amount: 1,
               transactionId: 1,
               transactionType: 1,
               paymentFor: 1,
               createdAt: 1,
               updatedAt: 1,
               "restaurantId.resName": 1,
               "restaurantId.profileType": 1
            }
         }
      ]);
      if (sponsorResNew.length > 0) {
         const result = {
            page: page,
            pageSize: pageSize,
            totalCount: totalCounts,
            sponsorRes: sponsorResNew,
         };
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No order found', HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAllWalletPaymnetHistory = async (req, res) => {
   try {
      let { restuarantType, search, fromDate, toDate, page, pageSize } = req.query;
      page = Number(page) || 1;
      pageSize = Number(pageSize) || 10;
      restuarantType = Number(restuarantType) || 1;
      let query = {
         isDeleted: false,
         restaurantStatus: 1,
         profileType: restuarantType,
         ...(search ? {
            $or: [
               { resName: { $regex: search, $options: "i" } }, // Case-insensitive search for restaurant name
            ]
         } : {})
      };

      // Fetch all restaurants matching the query
      const totalCounts = await RestaurantModel.countDocuments({
         isDeleted: false,
         restaurantStatus: 1,
         profileType: restuarantType,
      });
      const walletRes = await RestaurantModel.aggregate([
         {
            $match: query
         },
         {
            $lookup: {
               from: 'restaurantWallet',
               localField: '_id',
               foreignField: 'restaurantId',
               as: 'walletDetails',
            }
         },
         {
            $unwind: "$walletDetails"
         },

         {
            $match: {
               ...(search && /^[0-9a-fA-F]{24}$/.test(search) ? {
                  $or: [
                     { "walletDetails._id": new mongoose.Types.ObjectId(search) }
                  ]
               } : {}),
            }
         },
         {
            $lookup: {
               from: 'restaurantTransaction',
               localField: '_id',
               foreignField: 'restaurantId',
               as: 'transactionHistoryDetails',
            }
         },
         {
            $addFields: {
               transactionHistoryDetails: {
                  $filter: {
                     input: "$transactionHistoryDetails",
                     as: "transaction",
                     cond: { $eq: ["$$transaction.paymentFor", 1] } // Filter only paymentFor: 1
                  }
               }
            }
         },
         {
            $match: {
               "transactionHistoryDetails": { $ne: [] } // Ensure only documents with non-empty transactionHistoryDetails
            }
         },
         {
            $sort: {
               createdAt: -1,
            }
         },
         {
            $skip: (page - 1) * pageSize
         },
         {
            $limit: pageSize
         },
         {
            $project: {
               resName: 1,
               profileType: 1,
               createdAt: 1,
               "walletDetails": 1,
               "transactionHistoryDetails": 1,
               // "lastTransitionHistory": 
            }
         }
      ]);
      if (walletRes.length > 0) {
         const result = {
            page: page,
            pageSize: pageSize,
            totalCount: totalCounts,
            walletRes: walletRes,
         };
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No wallet found', HttpStatus.OK);
      }

   } catch (error) {
      // Handle errors
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getAllWalletPaymnetHistoryByWalletId = async (req, res) => {
   try {
      let { page, pageSize, restaurantId, search, fromDate, toDate } = req.query;
      page = Number(page) || 1;
      pageSize = Number(pageSize) || 10;
      let query = {
         restaurantId: new mongoose.Types.ObjectId(restaurantId),
         paymentFor: 1,
         isDeleted: false,
         ...(search && search.indexOf('#') != -1 ? { $or: [{ transactionId: search }] } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      }
      const totalCounts = await RestaurantTransactionModel.countDocuments(query);
      const walletRes = await RestaurantTransactionModel.aggregate([
         {
            $match: query
         },
         {
            $sort: {
               createdAt: -1, // Sort by transaction date descending
            }
         },
         {
            $skip: (page - 1) * pageSize
         },
         {
            $limit: pageSize
         }
      ]);
      if (walletRes.length > 0) {
         const result = {
            page: page,
            pageSize: pageSize,
            totalCount: totalCounts,
            walletRes: walletRes,
         };
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No wallet found', HttpStatus.OK);
      }
   } catch (error) {
      // Handle errors
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


export const getAllJoinSponsorPaymnetHistory = async (req, res) => {
   try {
      let {
         restuarantType,
         fromDate,
         toDate,
         search,
         page = 1,
         pageSize = 10,
         paymentFor,
      } = req.query;
      page = Number(page) || 1;
      pageSize = Number(pageSize) || 10;
      paymentFor = Number(paymentFor) || 2;
      let query = {
         paymentFor: paymentFor,
         isDeleted: false,
         ...(search && search.indexOf('#') != -1 ? { $or: [{ transactionId: search }] } : {}),
         ...(fromDate && toDate
            ? { createdAt: { $gte: parseInt(fromDate), $lte: parseInt(toDate) } }
            : {}),
      };
      const totalCounts = await RestaurantTransactionModel.countDocuments(query);
      const sponsorResNew = await RestaurantTransactionModel.aggregate([
         {
            $match: query
         },
         {
            $lookup: {
               from: 'Restaurant',
               localField: 'restaurantId',
               foreignField: '_id',
               as: 'restaurantId',
            }
         },
         {
            $match: {
               ...(restuarantType ? { "restaurantId.profileType": Number(restuarantType) } : {}),
               ...(search && search.indexOf('#') == -1 ? { "restaurantId.resName": { $regex: search, $options: 'i' } } : {})
            }
         },
         {
            $sort: { createdAt: -1 }
         },
         {
            $skip: (page - 1) * pageSize
         },
         {
            $limit: pageSize
         },
         {
            $project: {
               userId: 1,
               amount: 1,
               transactionId: 1,
               transactionType: 1,
               paymentFor: 1,
               createdAt: 1,
               updatedAt: 1,
               "restaurantId.resName": 1,
               "restaurantId.profileType": 1
            }
         }
      ])

      if (sponsorResNew.length > 0) {
         const result = {
            page: page,
            pageSize: pageSize,
            totalCount: totalCounts,
            sponsorRes: sponsorResNew,
         };
         return sendSuccessResponse(res, result, 'Payment history found', HttpStatus.OK);
      } else {
         return sendSuccessResponse(res, [], 'No order found', HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
