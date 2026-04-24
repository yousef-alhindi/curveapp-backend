import { Router } from 'express';
const router = Router();
import * as offer from '../../controllers/admin/offer';
import offer_validation from '../../validations/admin/offer.validation';
import { verifyAdminToken } from '../../middlewares/authentication';
import { celebrate, Segments } from 'celebrate';

/****************************************
 *************** SPRINT 1 ****************
 *****************************************/

router
   .route('/list')
   .get(
      verifyAdminToken,
      celebrate({ [Segments.QUERY]: offer_validation.GET_OFFER }),
      offer.getOfferList
   );

router
   .route('/vendor/list')
   .get(
      verifyAdminToken,
      celebrate({ [Segments.QUERY]: offer_validation.GET_OFFER_VENDOR }),
      offer.getOfferVendorList
   );

router
   .route('/')
   .post(verifyAdminToken, celebrate({ body: offer_validation.CREATE_OFFER }), offer.create);

router
   .route('/:id')
   .put(verifyAdminToken, celebrate({ body: offer_validation.UPDATE_OFFER }), offer.edit);

router.route('/:id').delete(verifyAdminToken, offer.deleteOffer);

router.route('/discount').get(verifyAdminToken, offer.showOfferDiscount);

export default router;
