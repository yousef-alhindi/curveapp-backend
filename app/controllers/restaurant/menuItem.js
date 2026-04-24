import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { menuItemModel } from '../../models/restaurant/menuItem.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;

export const getMenuList = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10, resCategoryId, itemType } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let itemTypeFilter = [];
      if (itemType === '1') {
         itemTypeFilter.push(1); // Veg
      } else if (itemType === '2') {
         itemTypeFilter.push(2); // Non-veg
      } else if (itemType === '3') {
         itemTypeFilter = [1, 2]; // Both (veg and non-veg)
      }
      let params = { isDeleted: false, resCategoryId: new ObjectId(resCategoryId) };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [{ name: { $regex: '.*' + search + '.*', $options: 'i' } }],
         });
      }
      let count = await menuItemModel.aggregate([
         {
            $match: params,
         },
         {
            $match: {
               itemType: { $in: itemTypeFilter },
            },
         },
      ]);
      const list = await menuItemModel
         .aggregate([
            {
               $match: params,
            },
            {
               $match: {
                  itemType: { $in: itemTypeFilter },
               },
            },
            {
               $project: {
                  name: 1,
                  restId: 1,
                  resCategoryId: 1,
                  itemType: 1,
                  image: 1,
                  description: 1,
                  price: 1,
                  nutrition: 1,
                  status: 1,
                  createdAt: 1,
               },
            },
            {
               $lookup: {
                  from: 'CustomiseItem',
                  let: { catId: '$_id' },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $and: [
                                 { $eq: ['$menuId', '$$catId'] },
                                 { $eq: ['$isDeleted', false] },
                                 { $eq: ['$status', true] },
                              ],
                           },
                        },
                     },
                  ],
                  as: 'customise',
               },
            },
            {
               $addFields: {
                  totalItems: { $size: '$customise' },
               },
            },
            {
               $project: {
                  name: 1,
                  restId: 1,
                  resCategoryId: 1,
                  itemType: 1,
                  image: 1,
                  description: 1,
                  price: 1,
                  nutrition: 1,
                  status: 1,
                  createdAt: 1,
                  totalItems: 1,
               },
            },
         ])
         .sort({ createdAt: -1 })
         .skip(skipIndex)
         .limit(limit);
      sendSuccessResponse(res, { count: count.length, list }, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const createMenuItem = async (req, res) => {
   try {
      let resData = req.restaurantData;
      req.body.restId = resData._id;
      if (!req.body?.resCategoryId) {
         return sendErrorResponse(res, 'Restaurant Category Id is Required', HttpStatus.FORBIDDEN);
      }
      if (!req.body.name) {
         return sendErrorResponse(res, 'Item Name is Required', HttpStatus.FORBIDDEN);
      }
      if (!req.body.itemType) {
         return sendErrorResponse(res, 'Item Type is Required', HttpStatus.FORBIDDEN);
      }
      if (!req.body.price) {
         return sendErrorResponse(res, 'Price is Required', HttpStatus.FORBIDDEN);
      }
      const add = await commonService.create(menuItemModel, req.body);
      if (add) {
         sendSuccessResponse(res, { data: add }, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const editMenuItem = async (req, res) => {
   try {
      let { _id } = req.body;

      const checkEditCat = await commonService.findOne(menuItemModel, { _id: _id });
      if (!checkEditCat) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(
         menuItemModel,
         checkEditCat._id,
         req.body
      );
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteMenuItem = async (req, res) => {
   try {
      let { _id, isDeleted } = req.body;
      const checkCat = await commonService.findOne(menuItemModel, { _id: _id });
      if (!checkCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(
         menuItemModel,
         { _id: checkCat._id },
         { isDeleted: isDeleted }
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
export const changeMenuStatus = async (req, res) => {
   try {
      let { _id, status } = req.body;
      const checkCat = await commonService.findOne(menuItemModel, { _id: _id });
      if (!checkCat) {
         sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
         return;
      }
      const update = await commonService.findOneAndUpdate(
         menuItemModel,
         { _id: checkCat._id },
         { status: status }
      );
      if (update) {
         sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
         return;
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
