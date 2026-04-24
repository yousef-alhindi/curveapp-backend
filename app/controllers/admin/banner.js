import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { BannerModel } from '../../models/admin/banner.model';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const getBannerList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate, searchQuery, bannerType, serviceType } = req.query;
      let matchStage = {  isDeleted: false};
      let earlyLookupStage = [];

      // Early Lookup Stage
      earlyLookupStage.push(
         {
            $lookup: {
               from: 'Offers',
               localField: 'offerRef',
               foreignField: '_id',
               as: 'offerData',
            },
         },
         { $unwind: '$offerData' }
      );

      // Handle Date Range Filtering
      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      // Status based Filtering
      if (bannerType) {
         matchStage.bannerType = Number(bannerType);
      }
      if (serviceType) {
         matchStage.service = serviceType;
      }

      // Handle Search Query
      if (searchQuery) {
         matchStage.$or = [{ name: { $regex: searchQuery, $options: 'i' } }];
      }

      const resp = await commonService.listAggregation({
         model: BannerModel,
         page,
         limit,
         searchQuery,
         matchStage,
         earlyLookupStage,
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

export const create = async (req, res) => {
   try {
      let data = req.body;
      const addOffer = await commonService.create(BannerModel, data);
      if (addOffer) {
         sendSuccessResponse(res, addOffer, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const edit = async (req, res) => {
   try {
      const { id } = req.params;
      const data = req.body;

      const checkOffer = await commonService.findOne(BannerModel, {
         _id: id,
      });
      if (!checkOffer) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }

      const update = await commonService.findOneAndUpdate(BannerModel, checkOffer._id, data);
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteBanner = async (req, res) => {
   try {
      const { id } = req.params;

      const checkResCat = await commonService.findOne(BannerModel, { _id: id });
      if (!checkResCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }

      const update = await commonService.findOneAndUpdate(BannerModel, checkResCat._id, { isDeleted: true });
      if (update) {
         sendSuccessResponse(res, {}, success.SUCCESS, HttpStatus.OK);
         return;
      }

      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
