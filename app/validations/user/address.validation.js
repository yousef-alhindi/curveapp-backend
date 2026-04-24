import { Joi } from 'celebrate';
const { addressLableType } = require('../../constants/address.constants');

export const addressValidation = {
   CREATE_ADDRESS: Joi.object().keys({
      lat: Joi.number().required(),
      long: Joi.number().required(),
      address: Joi.string().allow('', null).optional(),
      houseNo: Joi.string().allow('', null).optional(),
      buildingName: Joi.string().allow('', null).optional(),
      landmarkName: Joi.string().allow('', null).optional(),
      addressLabel: Joi.number()
         .valid(...Object.values(addressLableType))
         .default(1),
      remark: Joi.string().allow('', null).optional(),
   }),

   UPDATE_ADDRESS: Joi.object().keys({
      addressId: Joi.string().required(),
      // location: Joi.object({
      //     type: Joi.string().valid('Point').required(),
      //     coordinates: Joi.array().items(Joi.number()).length(2).required()
      // }).optional(),
      lat: Joi.number().allow('', null).optional(),
      long: Joi.number().allow('', null).optional(),
      address: Joi.string().allow('', null).optional(),
      houseNo: Joi.string().allow('', null).optional(),
      buildingName: Joi.string().allow('', null).optional(),
      landmarkName: Joi.string().allow('', null).optional(),
      addressLabel: Joi.number()
         .valid(...Object.values(addressLableType))
         .optional(),
      remark: Joi.string().allow('', null).optional(),
   }),

   DELETE_ADDRESS: Joi.object().keys({
      addressId: Joi.string().required(),
   }),
};
