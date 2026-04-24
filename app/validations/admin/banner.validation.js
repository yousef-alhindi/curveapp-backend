import { Joi } from 'celebrate';

import commonValidations from '../../services/common/common.validations.service';
import { serviceType } from '../../constants/common.constants';

import { bannerType } from '../../constants/banner.constants';

let banner = {
   GET_BANNER: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.number().allow(null, ''),
      searchQuery: Joi.string().allow(null, ''),
      serviceType: Joi.string()
         .valid(...Object.values(serviceType))
         .allow(null, ''),
      bannerType: Joi.string()
         .valid(...Object.values(bannerType).toString())
         .required(),
   }),
   GET_HOME_BANNER: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.number().allow(null, ''),
      serviceType: Joi.string().valid(...Object.values(serviceType)),
   }),

   GET_SERVICE_BANNER: Joi.object().keys({
      page: Joi.string().allow(null, ''),
      limit: Joi.string().allow(null, ''),
      fromDate: Joi.string().allow(null, ''),
      toDate: Joi.number().allow(null, ''),
      serviceType: Joi.string().valid(...Object.values(serviceType)),
   }),

   CREATE_BANNER: Joi.object().keys({
      name: Joi.string().required(),
      bannerType: Joi.string()
         .valid(...Object.values(bannerType))
         .required(),
      service: Joi.string()
         .valid(...Object.values(serviceType))
         .required(),
      image: Joi.string().uri().required(),
      colorCode: Joi.string().required(),
      offerRef: Joi.string().required(),
   }),

   UPDATE_BANNER: Joi.object().keys({
      name: Joi.string().required(),
      bannerType: Joi.string()
         .valid(...Object.values(bannerType))
         .required(),
      service: Joi.string()
         .valid(...Object.values(serviceType))
         .required(),
      image: Joi.string().uri().required(),
      colorCode: Joi.string().required(),
      offerRef: Joi.string().required(),
   }),
};

export default banner;
