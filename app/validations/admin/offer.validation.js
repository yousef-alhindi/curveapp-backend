import { Joi } from 'celebrate';

import commonValidations from '../../services/common/common.validations.service';
import { serviceType } from '../../constants/common.constants';
import {
   discountEligilityType,
   discountType,
   joiningFeeType,
} from '../../constants/offer.constants';

let offer = {
   GET_OFFER: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.string().allow(null, ''),
      searchQuery: Joi.string().allow(null, ''),
      serviceType: Joi.string()
         .valid(...Object.values(serviceType))
         .allow(null, ''),
   }),

   GET_OFFER_VENDOR: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.string().allow(null, ''),
      searchQuery: Joi.string().allow(null, ''),
      offerId: Joi.string().allow(null, ''),
   }),

   CREATE_OFFER: Joi.object().keys({
      name: Joi.string().required(),
      isPromoCodeRequired: Joi.boolean().required(),
      promoCode: Joi.string().when('isPromoCodeRequired', {
         is: true,
         then: Joi.required().messages({
            'any.required': 'promoCode is required.',
         }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'promoCode is not allowed.',
         }),
      }),
      joiningFeeType: Joi.string()
         .valid(...Object.values(joiningFeeType))
         .required(),
      joinFee: Joi.alternatives().conditional('joiningFeeType', {
         is: joiningFeeType.paid,
         then: Joi.number().required().messages({
            'any.required': 'joinFee is required.',
         }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'joinFee is not allowed.',
         }),
      }),
      service: Joi.string()
         .valid(...Object.values(serviceType))
         .required(),
      discountType: Joi.string()
         .valid(...Object.values(discountType))
         .required(),
      flatDiscountValue: commonValidations.numericString.when('discountType', {
         is: discountType.flat,
         then: Joi.required(),
         otherwise: Joi.optional(),
      }),
      percentDiscountValue: commonValidations.numericString.when('discountType', {
         is: discountType.percentage,
         then: Joi.required(),
         otherwise: Joi.optional(),
      }),
      minimumOrderValue: commonValidations.numericString.required(),
      bogoValues: Joi.alternatives().conditional('discountType', {
         is: discountType.bogo,
         then: Joi.object()
            .keys({
               buy: Joi.number(),
               get: Joi.number(),
            })
            .required()
            .messages({
               'any.required': 'bogoValues is required when discountType is BOGO',
            }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'bogoValues is not allowed unless discountType is BOGO',
         }),
      }),
      discountUpto: commonValidations.numericString,
      eligibityCriteria: Joi.string()
         .valid(...Object.values(discountEligilityType))
         .required(),
      termAndCondition: Joi.string().allow(null, ''),
      startDate: commonValidations.numericString,
      endDate: commonValidations.numericString,
   }),

   UPDATE_OFFER: Joi.object().keys({
      name: Joi.string().required(),
      isPromoCodeRequired: Joi.boolean().required(),
      promoCode: Joi.string().when('isPromoCodeRequired', {
         is: true,
         then: Joi.required().messages({
            'any.required': 'promoCode is required.',
         }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'promoCode is not allowed.',
         }),
      }),
      joiningFeeType: Joi.string()
         .valid(...Object.values(joiningFeeType))
         .required(),
      joinFee: Joi.alternatives().conditional('joiningFeeType', {
         is: joiningFeeType.paid,
         then: Joi.number().required().messages({
            'any.required': 'joinFee is required.',
         }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'joinFee is not allowed.',
         }),
      }),
      service: Joi.string()
         .valid(...Object.values(serviceType))
         .required(),
      discountType: Joi.string()
         .valid(...Object.values(discountType))
         .required(),
      flatDiscountValue: commonValidations.numericString.when('discountType', {
         is: discountType.flat,
         then: Joi.required(),
         otherwise: Joi.optional(),
      }),
      percentDiscountValue: commonValidations.numericString.when('discountType', {
         is: discountType.percentage,
         then: Joi.required(),
         otherwise: Joi.optional(),
      }),
      bogoValues: Joi.alternatives().conditional('discountType', {
         is: discountType.bogo,
         then: Joi.object()
            .keys({
               buy: Joi.number(),
               get: Joi.number(),
            })
            .required()
            .messages({
               'any.required': 'bogoValues is required when discountType is BOGO',
            }),
         otherwise: Joi.forbidden().messages({
            'any.unknown': 'bogoValues is not allowed unless discountType is BOGO',
         }),
      }),
      minimumOrderValue: commonValidations.numericString.required(),
      discountUpto: commonValidations.numericString.required(),
      eligibityCriteria: Joi.string()
         .valid(...Object.values(discountEligilityType))
         .required(),
      termAndCondition: Joi.string().allow(null, ''),
      startDate: commonValidations.numericString,
      endDate: commonValidations.numericString,
   }),
};

export default offer;
