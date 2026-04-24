import { Router } from "express";
import * as offer from '../../controllers/grocery/grocerySponser';
import { verifyGroceryToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 9 ****************
*****************************************/

router.route('/list').get(verifyGroceryToken, offer.sponserListController);
router.route('/history').get(verifyGroceryToken, offer.sponserListHistoryByRestaurentController);
router.route('/bid').post(verifyGroceryToken, offer.sponserBidController);
router.route('/spentPerDay').post(verifyGroceryToken, offer.sponserSpentPerDayController);
router.route('/spentPerDay').get(verifyGroceryToken, offer.sponserGetPerDayController);
router.route('/stopBid').post(verifyGroceryToken, offer.sponserStopBidController);
router.route('/active').get(verifyGroceryToken, offer.sponserActiveBidController);


export default router;
