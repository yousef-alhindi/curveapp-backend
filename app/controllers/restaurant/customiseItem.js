import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { CustomiseItemModel } from '../../models/restaurant/customiseItem.model';
const mongoose = require('mongoose'); // mongoose database
const ObjectId = mongoose.Types.ObjectId;
export const getCustomiseList = async (req, res) => {
   try {
      let { search = '', page = 1, limit = 10, menuId } = req.query;
      limit = parseInt(limit);
      page = parseInt(page);
      let skipIndex = (page - 1) * limit;
      let params = { isDeleted: false, menuId: new ObjectId(menuId),status:true };
      if (search != '' || search != undefined || search != null) {
         params = Object.assign(params, {
            $or: [{ name: { $regex: '.*' + search + '.*', $options: 'i' } }],
         });
      }
      let count = await CustomiseItemModel.countDocuments(params);
      const data = await CustomiseItemModel.find(params)
         .sort({ createdAt: -1 })
         .skip(skipIndex)
         .limit(limit);
      sendSuccessResponse(res, { count, data }, success.LIST_FETCH, HttpStatus.OK);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const createCustomiseItem = async (req, res) => {
   try {
      if (!req.body.menuId) {
         return sendErrorResponse(res, 'Menu Id is Required', HttpStatus.FORBIDDEN);
      }
      if (!req.body.name) {
         return sendErrorResponse(res, 'Name is Required', HttpStatus.FORBIDDEN);
      }
      if (!req.body.price) {
         return sendErrorResponse(res, 'Price is Required', HttpStatus.FORBIDDEN);
      }
      const add = await commonService.create(CustomiseItemModel, req.body);
      if (add) {
         sendSuccessResponse(res, { data: add }, success.SUCCESS, HttpStatus.OK);
      } else {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const editCustomiseItem = async (req, res) => {
   try {
      let { _id, name, price } = req.body;

      const checkEditCat = await commonService.findOne(CustomiseItemModel, { _id: _id });
      if (!checkEditCat) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(CustomiseItemModel, checkEditCat._id, {
         name,
         price,
      });
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
      } else {
         return sendSuccessResponse(res, update, success.UPDATED, HttpStatus.OK);
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};

export const deleteCustomiseItem = async (req, res) => {
   try {
      let { _id, isDeleted } = req.body;
      const checkCat = await commonService.findOne(CustomiseItemModel, { _id: _id });
      if (!checkCat) {
         return sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(
         CustomiseItemModel,
         { _id: checkCat._id },
         { isDeleted: isDeleted }
      );
      if (update) {
         return sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
export const changeStatus = async (req, res) => {
   try {
      let { _id, status } = req.body;
      const checkCat = await commonService.findOne(CustomiseItemModel, { _id: _id });
      if (!checkCat) {
         return sendSuccessResponse(res, {}, error.NOT_FOUND, HttpStatus.FORBIDDEN);
      }
      const update = await commonService.findOneAndUpdate(
         CustomiseItemModel,
         { _id: checkCat._id },
         { status: status }
      );
      if (update) {
         return sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
      }
      return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.FORBIDDEN);
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
