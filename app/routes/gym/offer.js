import { Router } from "express";
import * as offer from '../../controllers/gym/offerOrder';
import { verifyGymToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
*************** SPRINT 8 ****************
*****************************************/

router.route('/saveOrder').post(verifyGymToken, offer.OfferSaveTransaction);
router.route('/saveCategory').post(verifyGymToken, offer.offerSaveCategory);
router.route('/enrolledOfferList').get(verifyGymToken, offer.buyOfferList);
router.route('/newOfferList').get(verifyGymToken, offer.newOfferList);
router.route('/enrolledOffer/changeStatus').post(verifyGymToken, offer.offerActiveandDeactive);
router.route('/enrolledCategory/changeStatus').post(verifyGymToken, offer.categoryActiveandDeactive);


export default router;
    