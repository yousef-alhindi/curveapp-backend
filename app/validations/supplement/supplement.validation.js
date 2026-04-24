import { Joi } from "celebrate";

export const supplement = {
    ADD_SPONSOR_BID: Joi.object().keys({
        amount: Joi.number().required(),
    }),
    STOP_BID: Joi.object().keys({
        isBlocked: Joi.boolean().required(),
    }),
}