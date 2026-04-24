import { Router } from 'express';
const router = Router();
import * as sponsor from '../../controllers/admin/sponsor';
import sponsor_validation from '../../validations/admin/sponsor.validation';
import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

router
   .route('/')
   .get(
      verifyAdminToken,
      celebrate({ [Segments.QUERY]: sponsor_validation.GET_SPONSOR }),
      sponsor.getSponsorById
   );

router
   .route('/')
   .post(verifyAdminToken, celebrate({ body: sponsor_validation.CREATE_SPONSOR }), sponsor.create);

router
   .route('/:id')
   .put(verifyAdminToken, celebrate({ body: sponsor_validation.UPDATE_SPONSOR }), sponsor.edit);

export default router;
