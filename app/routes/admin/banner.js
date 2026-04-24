import { Router } from 'express';
const router = Router();
import * as banner from '../../controllers/admin/banner';
import banner_validation from '../../validations/admin/banner.validation';
import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

router
   .route('/list')
   .get(
      verifyAdminToken,
      celebrate({ [Segments.QUERY]: banner_validation.GET_BANNER }),
      banner.getBannerList
   );

router
   .route('/')
   .post(verifyAdminToken, celebrate({ body: banner_validation.CREATE_BANNER }), banner.create);

router
   .route('/:id')
   .put(verifyAdminToken, celebrate({ body: banner_validation.UPDATE_BANNER }), banner.edit);

router.route('/:id').delete(verifyAdminToken, banner.deleteBanner);

export default router;
