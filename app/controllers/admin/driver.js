import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { Delivery_Model } from '../../models/delivery/delivery.model';

export const getDriverListPending = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', fromDate = '', toDate = '' } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { fullyVerify: 0 };
      if (search != '' && search != null && search != undefined) {
         params = Object.assign(params, {
            $or: [
               {
                  name: { $regex: '.*' + search + '.*', $options: 'i' },
               },
               {
                  mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' },
               },
            ],
         });
      }
      if (fromDate != null && toDate != null && fromDate != '' && toDate != '') {
         const fromTimestamp = Number(fromDate);
         const toTimestamp = Number(toDate);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      }
      params.isBankDetailsUpdated = true;
      let count = await Delivery_Model.aggregate([
         {
            $match: params,
         },
      ]);
      let list = await Delivery_Model.aggregate([
         {
            $match: params,
         },
         {
            $project: {
               name: 1,
               countryCode: 1,
               mobileNumber: 1,
               profileImage: 1,
               vechileDetails: 1,
               addressDetails: 1,
               bankDetails: 1,
               email: 1,
               documents: 1,
               fullyVerify: 1,
               language: 1,
               gender: 1,
               dob: 1,
               createdAt: 1,
               isBlocked: 1,
               isSmoke: 1,
            },
         },
     
         {
            $sort: {
               createdAt: -1,
            },
         },
         { $skip: skipIndex },
         { $limit: limit },
      ]);

      sendSuccessResponse(
         res,
         { page: page || 1, limit, count: count.length, list },
         success.LIST_FETCH,
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getDriverListAccepted = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', fromDate = '', toDate = '' } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { fullyVerify: 1 };
      if (search != '' && search != null && search != undefined) {
         params = Object.assign(params, {
            $or: [
               {
                  name: { $regex: '.*' + search + '.*', $options: 'i' },
               },
               {
                  mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' },
               },
            ],
         });
      }
      if (fromDate != null && toDate != null && fromDate != '' && toDate != '') {
         const fromTimestamp = Number(fromDate);
         const toTimestamp = Number(toDate);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      }
      params.isBankDetailsUpdated = true;
      params.isDeleted = false;

      let count = await Delivery_Model.aggregate([
         {
            $match: params,
         },
      ]);
      let list = await Delivery_Model.aggregate([
         {
            $match: params,
         },
         {
            $project: {
               name: 1,
               countryCode: 1,
               mobileNumber: 1,
               profileImage: 1,
               vechileDetails: 1,
               addressDetails: 1,
               bankDetails: 1,
               email: 1,
               documents: 1,
               fullyVerify: 1,
               language: 1,
               gender: 1,
               dob: 1,
               createdAt: 1,
               isBlocked: 1,
               isSmoke: 1,
            },
         },
   
         {
            $sort: {
               createdAt: -1,
            },
         },
         { $skip: skipIndex },
         { $limit: limit },
      ]);

      sendSuccessResponse(
         res,
         { page: page || 1, limit, count: count.length, list },
         success.LIST_FETCH,
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const getDriverListRejected = async (req, res) => {
   try {
      let { page = 1, limit = 10, search = '', fromDate = '', toDate = '' } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = {};
      if (search != '' && search != null && search != undefined) {
         params = Object.assign(params, {
            $or: [
               {
                  name: { $regex: '.*' + search + '.*', $options: 'i' },
               },
               {
                  mobileNumber: { $regex: '.*' + search + '.*', $options: 'i' },
               },
            ],
         });
      }
      if (fromDate != null && toDate != null && fromDate != '' && toDate != '') {
         const fromTimestamp = Number(fromDate);
         const toTimestamp = Number(toDate);
         params = Object.assign(params, {
            createdAt: {
               $gte: fromTimestamp,
               $lte: toTimestamp,
            },
         });
      }
      params.isBankDetailsUpdated = true;
      let count = await Delivery_Model.aggregate([
         {
            $match: {
               $and: [
                  params,
                  {
                     fullyVerify: { $in: [2, 3] },
                  },
               ],
            },
         },
      ]);
      let list = await Delivery_Model.aggregate([
         {
            $match: {
               $and: [
                  params,
                  {
                     fullyVerify: { $in: [2, 3] },
                  },
               ],
            },
         },
         {
            $project: {
               name: 1,
               countryCode: 1,
               mobileNumber: 1,
               profileImage: 1,
               vechileDetails: 1,
               addressDetails: 1,
               bankDetails: 1,
               email: 1,
               documents: 1,
               fullyVerify: 1,
               language: 1,
               gender: 1,
               dob: 1,
               createdAt: 1,
               isBlocked: 1,
               rejected_reason: 1,
               isSmoke: 1,
            },
         },
    
         {
            $sort: {
               createdAt: -1,
            },
         },
         { $skip: skipIndex },
         { $limit: limit },
      ]);
      sendSuccessResponse(
         res,
         { page: page || 1, limit, count: count.length, list },
         success.LIST_FETCH,
         HttpStatus.OK
      );
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const updateDriverStatus = async (req, res) => {
   try {
      const { id, fullyVerify, rejected_reason } = req.body;
      if (!id) {
         return sendErrorResponse(res, 'please send id', HttpStatus.BAD_REQUEST);
      }
      const checkUser = await commonService.findById(Delivery_Model, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      let data = {
         fullyVerify: fullyVerify,
         rejected_reason: rejected_reason ? rejected_reason : '',
      };

      if (fullyVerify === 3) {
         data.isOtpVerified = false;
         data.isDocumentsUploaded = false;
         data.isVechileDocUploaded = false;
      } else if (fullyVerify === 2) {
         data.isOtpVerified = false;
         data.isDocumentsUploaded = false;
         data.isVechileDocUploaded = false;
         data.isBankDetailsUpdated = false;
      }
      const updated = await commonService.findOneAndUpdate(Delivery_Model, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const blockUnblockUser = async (req, res) => {
   try {
      const { id, isBlocked } = req.body;
      if (!id) {
         return sendErrorResponse(res, 'please send id', HttpStatus.BAD_REQUEST);
      }
      const checkUser = await commonService.findById(Delivery_Model, { _id: id }, {});
      if (!checkUser) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const data = {
         isBlocked: isBlocked,
      };
      const updated = await commonService.findOneAndUpdate(Delivery_Model, checkUser._id, data);
      if (updated) {
         return sendSuccessResponse(res, updated, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.SOMETHING_WRONG);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
