import HttpStatus from 'http-status-codes';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import * as commonService from '../../services/common/common.service';
import { FAQ_MODEL } from '../../models/admin/faq.model';
import { isValidObjectId } from 'mongoose';

export const addFaq = async (req, res) => {
  try {
    if (!req.body.question) {
      return sendSuccessResponse(res, {}, error.Question_Required, HttpStatus.BAD_REQUEST);
    }
    if (!req.body.service) {
      return sendSuccessResponse(res, {}, 'Please enter service', HttpStatus.BAD_REQUEST);
    }
    if (!req.body.answer) {
      return sendSuccessResponse(res, {}, error.Answer_Required, HttpStatus.BAD_REQUEST);
    }
    let data = await commonService.create(FAQ_MODEL, req.body);
    return sendSuccessResponse(res, { data }, success.SUCCESS, HttpStatus.OK);
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
  }
};
export const faqList = async (req, res) => {
  try {
    let { search = '', page = 1, limit = 10, service } = req.query;
    if (!service) {
      return sendSuccessResponse(res, {}, 'Please provide service in query', HttpStatus.BAD_REQUEST);
    }

    limit = parseInt(limit);
    page = parseInt(page);
    let skipIndex = (page - 1) * limit;
    let params = { isDeleted: false, service: Number(service) };
    if (search != '' || search != undefined || search != null) {
      params = Object.assign(params, {
        $or: [{ question: { $regex: '.*' + search + '.*', $options: 'i' } }],
      });
    }
    let count = await FAQ_MODEL.countDocuments(params);
    let list = await FAQ_MODEL.find(params).sort({ createdAt: -1 }).skip(skipIndex).limit(limit);
    return sendSuccessResponse(res, { count: count, list: list }, 'Faq List', HttpStatus.OK);
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
  }
};

export const updateFaq = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return sendErrorResponse(res, "Id is invalid", 400);
    }

    let data = await commonService.findOneAndUpdate(FAQ_MODEL, id, req.body);
    return sendSuccessResponse(res, { data }, success.UPDATED, HttpStatus.OK);
  } catch (error) {
    console.log(error);
    return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
  }
};
