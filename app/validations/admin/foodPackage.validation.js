import { Joi } from 'celebrate';

import commonValidations from '../../services/common/common.validations.service';
import { serviceType } from '../../constants/common.constants';
import { goal, duration } from '../../constants/foodPackage.constants';

export const foodPackageValidation = {
   CREATE_PACKAGE: Joi.object().keys({
      goal: Joi.number()
         .valid(...Object.values(goal)) // Matches the enum in the Mongoose schema
         .default(goal.GAIN_WEIGHT),

      duration: Joi.number()
         .valid(...Object.values(duration)) // Matches the enum in the Mongoose schema
         .default(duration.WEEKLY),

      price: Joi.number().min(0).default(0),

      termAndCondition: Joi.string().allow('').default(''),

      restaurants: Joi.array(),
         // .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)) // Validate ObjectId format
         // .required(), // Restaurants field is now required

      name: Joi.string().allow('').default(''),

      description: Joi.string().allow('').default(''),

      upTo: Joi.number().min(1).default(1),
   }),
   EDIT_PACKAGE: Joi.object().keys({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      goal: Joi.number()
         .valid(...Object.values(goal)) // Matches the enum in the Mongoose schema
         .default(goal.GAIN_WEIGHT),

      duration: Joi.number()
         .valid(...Object.values(duration)) // Matches the enum in the Mongoose schema
         .default(duration.WEEKLY),

      price: Joi.number().min(0).default(0),

      termAndCondition: Joi.string().allow('').default(''),

      restaurants: Joi.array(),
      //    .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)) // Validate ObjectId format
      //    .required(), // Restaurants field is now required

      name: Joi.string().allow('').default(''),

      description: Joi.string().allow('').default(''),

      upTo: Joi.number().min(1).default(1),
   }),
   DELETE_PACKAGE: Joi.object().keys({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      isDeleted: Joi.boolean().required()
   }),
   RESTUARANT_LIST: Joi.object().keys({
      id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
   }),
   CATEGORY_LIST: Joi.object().keys({
      restId: Joi.string().required(),
   }),

};
