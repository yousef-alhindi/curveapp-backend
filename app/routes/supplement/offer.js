import { Router } from "express";
import * as offer from '../../controllers/supplement/offerOrder';
import { verifySupplementToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route('/saveOrder').post(verifySupplementToken, offer.OfferSaveTransaction);
router.route('/saveCategory').post(verifySupplementToken, offer.offerSaveCategory);
router.route('/enrolledOfferList').get(verifySupplementToken, offer.buyOfferList);
router.route('/newOfferList').get(verifySupplementToken, offer.newOfferList);
router.route('/enrolledOffer/changeStatus').post(verifySupplementToken, offer.offerActiveandDeactive);
router.route('/enrolledCategory/changeStatus').post(verifySupplementToken, offer.categoryActiveandDeactive);


export default router;
    