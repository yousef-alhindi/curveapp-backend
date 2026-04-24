import { Joi } from "celebrate";

const commonValidations = {
  alphaString: Joi.string().pattern(/^[a-zA-Z\s]+$/),
  numericString: Joi.string().pattern(/^[0-9]+$/),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(7)
    .max(15),

  email: Joi.string().email(),
  countryCode: Joi.string().pattern(/^\+\d+$/),
  titleDescription: Joi.array().items(
    Joi.object({
      title: Joi.object({
        english: Joi.string().required(),
        arabic: Joi.string().required(),
      }).required(),
      description: Joi.object({
        english: Joi.string().required(),
        arabic: Joi.string().required(),
      }).required(),
    })
  ),
};

export default commonValidations;
