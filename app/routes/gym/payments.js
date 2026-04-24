import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as payments from '../../controllers/gym/payments';
const router = Router();

router.route('/').get(verifyGymToken, payments.getGymTransactionData);
router.route('/payoutHistory').get(verifyGymToken, payments.getPayoutHistory);

export default router;