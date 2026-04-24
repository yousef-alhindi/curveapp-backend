import HttpStatus from 'http-status-codes';
import * as commonService from '../../services/common/common.service';
import { sendSuccessResponse, sendErrorResponse } from '../../responses/response';
import { success, error } from '../../responses/messages';
import mongoose from 'mongoose';
import { serviceModelMap } from '../../constants/service.constants';
import { SPONSOR_MODEL } from '../../models/admin/sponsor.model';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

export const getSponsorById = async (req, res) => {
   try {
      const { service } = req.query;

      const resp = await commonService.findOne(SPONSOR_MODEL, { service });

      if (resp) {
         sendSuccessResponse(res, resp, success.SUCCESS, HttpStatus.OK);
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
      const addOffer = await commonService.create(SPONSOR_MODEL, data);
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
      let { id } = req.params;
      let data = req.body;

      const checkSponsor = await commonService.findOne(SPONSOR_MODEL, {
         _id: id,
      });
      if (!checkSponsor) {
         return sendErrorResponse(res, error.NOT_FOUND, HttpStatus.BAD_REQUEST);
      }
      const update = await commonService.findOneAndUpdate(SPONSOR_MODEL, checkSponsor._id, data);
      if (!update) {
         return sendErrorResponse(res, error.DEFAULT_ERROR, HttpStatus.BAD_REQUEST);
      } else {
         sendSuccessResponse(res, update, success.SUCCESS, HttpStatus.OK);
         return;
      }
   } catch (error) {
      return sendErrorResponse(res, error.message, HttpStatus.SOMETHING_WRONG);
   }
};
