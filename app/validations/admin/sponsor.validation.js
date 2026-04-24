import { Joi } from 'celebrate';

import commonValidations from '../../services/common/common.validations.service';
import { serviceType } from '../../constants/common.constants';

let sponsor = {
   GET_SPONSOR: Joi.object().keys({
      service: commonValidations.alphaString.valid(...Object.values(serviceType)).required(),
   }),

   CREATE_SPONSOR: Joi.object().keys({
      service: commonValidations.alphaString.valid(...Object.values(serviceType)).required(),
      minimumBid: Joi.string().required()
   }),

   UPDATE_SPONSOR: Joi.object().keys({
      minimumBid: Joi.string().required()
   }),
};

export default sponsor;
