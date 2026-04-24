import { Joi } from 'celebrate';
const { serviceType } = require('../../constants/common.constants');

const serviceTypeValues = Object.values(serviceType);


export const loyaltyPointValidation = {
   CREATE_LOYALTY_POINTS: Joi.object({
      service: Joi.string()
        .valid(...serviceTypeValues) // Use the values of serviceType
        .required(),
      loyaltyPoints: Joi.object({
         minOrderForCashback: Joi.number().min(0).optional(),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
      stepsForLoyaltyPoints: Joi.object({
         dailySteps: Joi.number().min(0).optional(),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
      perCashbackPointsValue: Joi.number().positive().required(),
      spendingLimit: Joi.object({
         minOrderValue: Joi.number().min(0).optional(),
         maxRedeemLoyaltyPoints: Joi.number().min(0).optional(),
      }).optional(),
      loyaltyWelcomeBonus: Joi.object({
         referAndEarn: Joi.boolean().default(false),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
   }),
   UPDATE_LOYALTY_POINTS: Joi.object({
      service: Joi.string()
        .valid(...serviceTypeValues) // Use the values of serviceType
        .optional(),
      loyaltyPoints: Joi.object({
         minOrderForCashback: Joi.number().min(0).optional(),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
      stepsForLoyaltyPoints: Joi.object({
         dailySteps: Joi.number().min(0).optional(),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
      perCashbackPointsValue: Joi.number().positive().optional(),
      spendingLimit: Joi.object({
         minOrderValue: Joi.number().min(0).required(),
         maxRedeemLoyaltyPoints: Joi.number().min(0).optional(),
      }).optional(),
      loyaltyWelcomeBonus: Joi.object({
         referAndEarn: Joi.boolean().default(false),
         cashbackPoints: Joi.number().min(0).optional(),
      }).optional(),
      status: Joi.number().valid(1, 0).optional(),
   }),
};
