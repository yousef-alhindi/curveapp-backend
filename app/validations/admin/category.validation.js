import { Joi } from 'celebrate';

import commonValidations from '../../services/common/common.validations.service';
import { serviceType, variableCategory } from '../../constants/common.constants';

import { bannerType } from '../../constants/banner.constants';
import { categoryStatus, logicType, sectionType } from '../../constants/category.constants';
import { joiningFeeType } from '../../constants/offer.constants';

let banner = {
   GET_CATEGORY_LIST: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.number().allow(null, ''),
      searchQuery: Joi.string().allow(null, ''),
      serviceType: Joi.string()
         .valid(...Object.values(serviceType))
         .allow(null, ''),
      status: Joi.string()
         .valid(...Object.values(categoryStatus).toString())
         .allow(null, ''),
      categoryType: Joi.string()
         .valid(...Object.values(sectionType).toString())
         .allow(null, ''),
      variableCategory: Joi.string()
         .valid(...Object.values(variableCategory))
         .allow(null, ''), //critical fix

   }),

   // CREATE_CATEGORY: Joi.object().keys({
   //    categoryName: Joi.string().required(),
   //    description: Joi.string().required(),
   //    // bannerType: Joi.string()
   //    //    .valid(...Object.values(bannerType))
   //    //    .required(),
   //    service: Joi.string()
   //       .valid(...Object.values(serviceType))
   //       .required(),
   //    logicType: Joi.string()
   //       .valid(...Object.values(logicType))
   //       .required(),
   //    joiningFeeType: Joi.string()
   //       .valid(...Object.values(joiningFeeType))
   //       .required(),
   //    joinFee: Joi.alternatives().conditional('joiningFeeType', {
   //       is: joiningFeeType.paid,
   //       then: Joi.number().required().messages({
   //          'any.required': 'joinFee is required.',
   //       }),
   //       otherwise: Joi.forbidden().messages({
   //          'any.unknown': 'joinFee is not allowed.',
   //       }),
   //    }),
   //    sectionType: Joi.number().optional()
   // }),
   CREATE_CATEGORY: Joi.object().keys({
      categoryName: Joi.string().required(),
      description: Joi.string().required(),
      category: Joi.string().required(),
      logicType: Joi.string()
         .valid(...Object.values(logicType))
         .required(),
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
      sectionType: Joi.number().optional()
   }),

   EDIT_CATEGORY: Joi.object().keys({
      categoryName: Joi.string().required(),
      description: Joi.string().required(),
      category: Joi.string().required(),
      logicType: Joi.number()
         .valid(...Object.values(logicType))
         .required(),
      joiningFeeType: Joi.number()
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
   }),

   EDIT_CATEGORY_STATUS: Joi.object().keys({
      status: Joi.string()
         .valid(...Object.values(categoryStatus))
         .required(),
   }),

   // EDIT_CATEGORY_POSITION: Joi.object().keys({
   //    position: Joi.number().required(),
   // }),
};

export default banner;
