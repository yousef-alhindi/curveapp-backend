import { Router } from "express";
import * as offer from '../../controllers/restaurant/offerOrder';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/saveOrder').post(verifyRestaurantToken, offer.OfferSaveTransaction);
router.route('/saveCategory').post(verifyRestaurantToken, offer.offerSaveCategory);
router.route('/enrolledOfferList').get(verifyRestaurantToken, offer.buyOfferList);
router.route('/newOfferList').get(verifyRestaurantToken, offer.newOfferList);
router.route('/enrolledOffer/changeStatus').post(verifyRestaurantToken, offer.offerActiveandDeactive);
router.route('/enrolledCategory/changeStatus').post(verifyRestaurantToken, offer.categoryActiveandDeactive);


export default router;
    