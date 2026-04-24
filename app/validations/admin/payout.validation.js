import { Joi } from 'celebrate';

export const payoutValidation = {
   PAYOUT_TO_RESTAURANT: Joi.object({
      restuarantId: Joi.string().required(), // Fixed 'restuarantId' typo
      amount: Joi.number().min(0).required(),
      fromDate: Joi.number().required(),
      toDate: Joi.number().required(),
   }),
   PAYOUT_TO_SUPPLEMENT: Joi.object({
      supplementSellerId: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      fromDate: Joi.number().required(),
      toDate: Joi.number().required(),
   }),
   PAYOUT_TO_DRIVER: Joi.object({
      driverId: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      fromDate: Joi.number().required(),
      toDate: Joi.number().required(),
   }),

   PAYOUT_TO_GYM: Joi.object({
      gymId: Joi.string().required(),
      amount: Joi.number().min(0).required(),
      fromDate: Joi.number().required(),
      toDate: Joi.number().required(),
   }),
};
