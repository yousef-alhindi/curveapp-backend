import { Router } from 'express';
import {
   getAllResturantPaymnetHistory,
   getAllOfferEnrollmentPaymnetHistory,
   getAllWalletPaymnetHistory,
   getAllJoinSponsorPaymnetHistory,
   getAllWalletPaymnetHistoryByWalletId,
   getAllSupplementPaymnetHistory,
   getGymPaymentHistory
} from '../../controllers/admin/payment';
const router = Router();

router.route('/restuarant').get(getAllResturantPaymnetHistory);
router.route('/supplement').get(getAllSupplementPaymnetHistory);
router.route('/gym').get(getGymPaymentHistory);
router.route('/offer-enrollment').get(getAllOfferEnrollmentPaymnetHistory);
router.route('/wallet').get(getAllWalletPaymnetHistory);
router.route('/join-sponser').get(getAllJoinSponsorPaymnetHistory);
router.route('/wallet/list').get(getAllWalletPaymnetHistoryByWalletId);

export default router;
