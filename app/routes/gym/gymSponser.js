import { Router } from "express";
import { gym } from "../../validations/gym/gym.validation"
import * as offer from '../../controllers/gym/gymSponser';
import { verifyGymToken } from "../../middlewares/authentication";
import { celebrate } from "celebrate";
const router = Router();

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route('/list').get(verifyGymToken, offer.sponserListController);
router.route('/history').get(verifyGymToken, offer.sponserListHistoryByGymController);
router.route('/bid').post(celebrate({ body: gym.ADD_SPONSOR_BID }), verifyGymToken, offer.sponserBidController);
router.route('/spentPerDay').post(celebrate({ body: gym.ADD_SPONSOR_BID }), verifyGymToken, offer.sponserSpentPerDayController);
router.route('/spentPerDay').get(verifyGymToken, offer.sponserGetPerDayController);
router.route('/stopBid').post(celebrate({ body: gym.STOP_BID }), verifyGymToken, offer.sponserStopBidController);
router.route('/active').get(verifyGymToken, offer.sponserActiveBidController);


export default router;
