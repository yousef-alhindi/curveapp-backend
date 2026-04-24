import { Router } from "express";
import * as subscription from '../../controllers/restaurant/offerSubscription';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/saveOrder').post( verifyRestaurantToken, subscription.subscriptionSaveTransaction);
router.route('/buyList').get( verifyRestaurantToken, subscription.subscriptionBuyList);
router.route('/newList').get( verifyRestaurantToken, subscription.newSubcriptionList);


export default router;
