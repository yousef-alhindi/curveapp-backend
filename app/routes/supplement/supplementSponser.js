import { Router } from "express";
import { supplement } from "../../validations/supplement/supplement.validation"
import * as offer from '../../controllers/supplement/supplementSponser';
import { verifySupplementToken } from "../../middlewares/authentication";
import { celebrate } from "celebrate";
const router = Router();

/****************************************
*************** SPRINT 6 ****************
*****************************************/

router.route('/list').get(verifySupplementToken, offer.sponserListController);
router.route('/history').get(verifySupplementToken, offer.sponserListHistoryBySupplementController);
router.route('/bid').post(celebrate({ body: supplement.ADD_SPONSOR_BID }), verifySupplementToken, offer.sponserBidController);
router.route('/spentPerDay').post(celebrate({ body: supplement.ADD_SPONSOR_BID }), verifySupplementToken, offer.sponserSpentPerDayController);
router.route('/spentPerDay').get(verifySupplementToken, offer.sponserGetPerDayController);
router.route('/stopBid').post(celebrate({ body: supplement.STOP_BID }), verifySupplementToken, offer.sponserStopBidController);
router.route('/active').get(verifySupplementToken, offer.sponserActiveBidController);


export default router;
