import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import { BannerModel } from '../../models/admin/banner.model';
import { bannerType } from '../../constants/banner.constants';
import * as commonService from '../../services/common/common.service';

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

export const homeBannerList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate, serviceType } = req.query;
      let matchStage = { isDeleted: false};
      let earlyLookupStage = [];

      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      // service based Filtering
      if (serviceType) {
         matchStage.service = serviceType;
      }

      //   Banner Type
      matchStage.bannerType = bannerType.home;

      const resp = await commonService.listAggregation({
         model: BannerModel,
         page,
         limit,
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

export const serviceBannerList = async (req, res) => {
   try {
      const { page, limit, fromDate, toDate, serviceType } = req.query;
      let matchStage = { isDeleted: false};
      let earlyLookupStage = [];

      if (fromDate && toDate) {
         matchStage.createdAt = {
            $gte: new Date(Number(fromDate)),
            $lte: new Date(Number(toDate)),
         };
      }

      if (serviceType) {
         matchStage.service = serviceType;
      }

      //   Banner Type
      matchStage.bannerType = bannerType.service;

      const resp = await commonService.listAggregation({
         model: BannerModel,
         page,
         limit,
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
