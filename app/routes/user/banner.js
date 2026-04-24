import { Router } from 'express';
import * as banner from '../../controllers/user/banner';
import { verifyUserToken } from '../../middlewares/authentication';
import banner_validation from '../../validations/admin/banner.validation';
import { celebrate, Segments } from 'celebrate';

const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router
   .route('/home/list')
   .get(
      verifyUserToken,
      celebrate({ [Segments.QUERY]: banner_validation.GET_HOME_BANNER }),
      banner.homeBannerList
   );

router
   .route('/service/List')
   .get(
      verifyUserToken,
      celebrate({ [Segments.QUERY]: banner_validation.GET_SERVICE_BANNER }),
      banner.serviceBannerList
   );

export default router;
