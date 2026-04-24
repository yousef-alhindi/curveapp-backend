import { Router } from "express";
import * as payment from '../../controllers/supplement/payment';
import { verifySupplementToken } from "../../middlewares/authentication";
const router = Router();

router.route('/getOrderTransactionData').get(verifySupplementToken, payment.getOrderTransactionData);

router.route('/getPayoutHistory').get(verifySupplementToken, payment.getPayoutHistory);

export default router;
