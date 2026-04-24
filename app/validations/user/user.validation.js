import { Joi } from "celebrate";

export const user = {
    ADD_RESTAURENT_CART: Joi.object().keys({
        itemId: Joi.string().required(),
        quantity: Joi.number().required(),
        type: Joi.number().required(),
        instructions: Joi.string().allow(""),
        customize: Joi.array().items(Joi.string()).required(),
        deliveryOption : Joi.number()
    }),
}