import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { GymModel } from '../../models/gym/gym.model';
import { RATING_MODEL } from '../../models/user/rating.model';
import GymSubscriptions from '../../models/gym/gymSubscriptions';
const mongoose = require('mongoose'); // mongoose database

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/

export const GymListPending = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', from = '', to = '', gymNameSort = -1 } = req.query;
      //gymNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { gymStatus: 0, isBankDetailsUpdated: true };
      // if (search != '' && search != null && search != undefined) {
      //    params.name = { $regex: '.*' + search + '.*', $options: 'i' }
      // }
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
      let count = await GymModel.countDocuments(params);
      const getAllGym = await GymModel.find(params).sort({ createdAt: -1 }).skip(skipIndex).limit(limit);
      if (getAllGym) {
         sendSuccessResponse(res, { count: count, list: getAllGym }, success.LIST_FETCH, HttpStatus.OK);
         return;
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const gymListAccepted = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', from = '', to = '', gymNameSort = -1 } = req.query;
      //gymNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { gymStatus: 1 };
      // if (search != '' && search != null && search != undefined) {
      //    params.name = { $regex: '.*' + search + '.*', $options: 'i' }
      // }
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
      let count = await GymModel.countDocuments(params);
      const getAllGym = await GymModel.find(params).sort({ name: gymNameSort, createdAt: -1 }).skip(skipIndex).limit(limit);
      if (getAllGym) {
         return sendSuccessResponse(res, { count: count, list: getAllGym }, success.LIST_FETCH, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const packageList = async (req, res) => {
   try {
      let { gymId } = req.params;
      let { page = 1, limit = 10 } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let GymPackages = [];
      if (GymPackages) {
         return sendSuccessResponse(res, GymPackages, success.LIST_FETCH, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const gymStats = async (req, res) => {
   try {
      let { gymId } = req.params;
      let data = {
         totalPackagesAdded: 0,
         totalPackagesBooked: 0,
         totalEarnings: 0,
         totalCreditEarned: 0,
         totalCreditUsed: 0,
         totalOfferEnrolled: 0,
         totalRating: 5
      }
      if (data) {
         return sendSuccessResponse(res, data, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
}

export const gymListRejected = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', from = '', to = '', gymNameSort = -1 } = req.query;
      //gymNameSort {1:ascending , -1:descending}
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { gymStatus: 2 };
      // if (search != '' && search != null && search != undefined) {
      //    params.name = { $regex: '.*' + search + '.*', $options: 'i' }
      // }
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
      let count = await GymModel.countDocuments(params);
      const getAllGym = await GymModel.find(params).sort({ name: gymNameSort, createdAt: -1 }).skip(skipIndex).limit(limit);
      if (getAllGym) {
         return sendSuccessResponse(res, { count: count, list: getAllGym }, success.LIST_FETCH, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateGymStatus = async (req, res) => {
   try {
      const { id, gymStatus, rejected_reason } = req.body;
      const checkGym = await commonService.findById(GymModel, { _id: id }, {});
      if (!checkGym) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         gymStatus: gymStatus,
         rejected_reason: rejected_reason ? rejected_reason : '',
      };

      if (gymStatus === 2) {
         data.isBankDetailsUpdated = false;
         data.isDocumentsUploaded = false;
      }
      const updated = await commonService.findOneAndUpdate(GymModel, checkGym._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const blockUnblockGym = async (req, res) => {
   try {
      const { id, isBlocked } = req.body;
      const checkGym = await commonService.findById(GymModel, { _id: id }, {});
      if (!checkGym) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const data = {
         isBlocked: isBlocked,
      };
      const updated = await commonService.findOneAndUpdate(GymModel, checkGym._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const gymSubscriptions = async (req, res) => {
   try {
      const { search, page = 1, limit = 10, active, startDate, endDate, gymId } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const searchQuery = {}
      if (search) {
         searchQuery.$or = [
            { subscriptionId: { $regex: search, $options: 'i' } },
            { "user.fullName": { $regex: search, $options: 'i' } },
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

      if (gymId) {
         matchStage.gymId = new mongoose.Types.ObjectId(gymId)
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
            $lookup: {
               from: "Gym",
               localField: "gymId",
               foreignField: "_id",
               as: "gymDetails"
            }
         },
         { $unwind: "$gymDetails" },
         {
            $lookup: {
               from: "GymCart",
               localField: "gymCartId",
               foreignField: "_id",
               as: "gymCartDetails"
            }
         },
         { $unwind: "$gymCartDetails" },
         {
            $lookup: {
               from: "GymPkg",
               localField: "gymCartDetails.packageId",
               foreignField: "_id",
               as: "packageDetails"
            }
         },
         { $unwind: "$packageDetails" },
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

export const subscriptionReview = async (req, res) => {
   try {
      const { subscriptionId } = req.params;
      const review = await RATING_MODEL.findOne({ subscriptionId });
      return sendSuccessResponse(res, review ? review : {}, "Subscription Review", HttpStatus.OK)
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};