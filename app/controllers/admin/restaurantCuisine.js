import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestaurantCuisineModel } from '../../models/admin/cuisine.model';

export const getResCatList = async (req, res) => {
   try {
      const getAllUser = await commonService.getAllByConditionFieldsBySorting(
         RestaurantCuisineModel,
         { isDeleted: false },
         { createdAt: -1 }
      );
      if (getAllUser) {
         sendSuccessResponse(res, getAllUser, success.LIST_FETCH, HttpStatus.OK);
      } else {
         sendSuccessResponse(res, [], error.NOT_FOUND, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const create = async (req, res) => {
   try {
      const addResCat = await commonService.create(RestaurantCuisineModel, {
         cuisineName: req.body?.resCategory,
      });
      if (addResCat) {
         sendSuccessResponse(res, addResCat, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const edit = async (req, res) => {
   try {
      let { _id, resCategory } = req.body;

      const checkResCat = await commonService.findOne(RestaurantCuisineModel, { _id: _id });
      if (!checkResCat) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(RestaurantCuisineModel, checkResCat._id, {
         cuisineName: resCategory,
      });
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

export const deleteResCat = async (req, res) => {
   try {
      let { id } = req.params;
      const checkResCat = await commonService.findOne(RestaurantCuisineModel, { _id: id });
      if (!checkResCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(
         RestaurantCuisineModel,
         {
            _id: checkResCat._id,
         },
         {
            isDeleted: true,
         }
      );
      if (update) {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
