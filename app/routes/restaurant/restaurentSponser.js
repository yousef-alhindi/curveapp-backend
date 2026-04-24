import { Router } from "express";
import { restaurent } from "../../validations/restaurent/restaurent.validation"
import * as offer from '../../controllers/restaurant/restaurentSponser';
import { verifyRestaurantToken } from "../../middlewares/authentication";
import { celebrate } from "celebrate";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/list').get(verifyRestaurantToken, offer.sponserListController);
router.route('/history').get(verifyRestaurantToken, offer.sponserListHistoryByRestaurentController);
router.route('/bid').post(celebrate({ body: restaurent.ADD_SPONSOR_BID }), verifyRestaurantToken, offer.sponserBidController);
router.route('/spentPerDay').post(celebrate({ body: restaurent.ADD_SPONSOR_BID }), verifyRestaurantToken, offer.sponserSpentPerDayController);
router.route('/spentPerDay').get(verifyRestaurantToken, offer.sponserGetPerDayController);
router.route('/stopBid').post(celebrate({ body: restaurent.STOP_BID }), verifyRestaurantToken, offer.sponserStopBidController);
router.route('/active').get(verifyRestaurantToken, offer.sponserActiveBidController);


export default router;
