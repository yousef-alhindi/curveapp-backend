import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { RestaurantCategoryModel } from '../../models/admin/restaurantCategory.model';
import { RestaurantCuisineModel } from '../../models/admin/cuisine.model';
import { notificationModel } from "../../models/admin/notification.model.js"

export const CategoryList = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10 } = req.query;
      let resId = req?.restaurantData?._id;
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [{ resCategory: { $regex: '.*' + search + '.*', $options: 'i' } }],
         });
      }
      params.restId = resId;
      let count = await RestaurantCategoryModel.countDocuments(params);
      const getCategory = await RestaurantCategoryModel.aggregate([
         {
            $match: params,
         },
         {
            $lookup: {
               from: 'MenuItem',
               let: { catId: '$_id' },
               pipeline: [
                  {
                     $match: {
                        $expr: {
                           $and: [
                              { $eq: ['$resCategoryId', '$$catId'] },
                              { $eq: ['$isDeleted', false] },
                           ],
                        },
                     },
                  },
               ],
               as: 'menuDetail',
            },
         },
         {
            $addFields: {
               totalMenuItems: { $size: '$menuDetail' },
            },
         },
         {
            $project: {
               resCategory: 1,
               status: 1,
               createdAt: 1,
               totalMenuItems: 1,
            },
         },
         { $sort: { createdAt: -1 } },
      ])
         .skip(skipIndex)
         .limit(limit);
      sendSuccessResponse(res, { count, getCategory }, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const CategoryCuisineList = async (req, res) => {
   try {
      let params = { isDeleted: false };
      const getCuisine = await RestaurantCuisineModel.aggregate([
         {
            $match: params,
         },
         // {
         //    $project: {
         //       resCategory: 1,
         //       createdAt: 1,
         //    },
         // },

         { $sort: { createdAt: -1 } },
      ]);

      sendSuccessResponse(res, { getCuisine }, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


export const createCategory = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData?._id;

      // Normalize category name to lowercase
      const normalizedCategoryName = req.body.categoryName;

      // Update the request body with the normalized category name
      req.body.resCategory = normalizedCategoryName;

      // Check for an existing category with a case-insensitive comparison
      let data = await commonService.findOne(RestaurantCategoryModel, {
         resCategory: normalizedCategoryName,
         restId: resData?._id
      });

      if (data) {
         return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
      }

      // Add the category with normalized name
      req.body.categoryName = normalizedCategoryName; // Ensure the category name is stored in lowercase
      const addCat = await commonService.create(RestaurantCategoryModel, req.body);
      const notification = new notificationModel({
                  notification_type: 1,
                  title: "new category created successfully",
                  description: "new category created successfully",
                  sendTo: 1
              });
              await notification.save();

      return sendSuccessResponse(res, addCat, success.SUCCESS, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};


export const editCategory = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      let { _id, categoryName } = req.body;
            const normalizedCategoryName = req.body.categoryName.toLowerCase();
      const checkEditCat = await commonService.findOne(RestaurantCategoryModel, {resCategory: normalizedCategoryName,
         restId: resData?._id });

         if (checkEditCat) {
            return sendErrorResponse(res, 'Category Name already exists', HttpStatus.FORBIDDEN);
         }
         req.body.categoryName = normalizedCategoryName;
      const update = await commonService.findOneAndUpdate(
         RestaurantCategoryModel,
         _id,
         {
            resCategory: req.body.categoryName,
         }
      );
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

export const deleteCategory = async (req, res) => {
   try {
      let { _id, isDeleted } = req.body;
      const checkCat = await commonService.findOne(RestaurantCategoryModel, { _id: _id });
      if (!checkCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(RestaurantCategoryModel, checkCat._id, { isDeleted: true });
      if (update) {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
