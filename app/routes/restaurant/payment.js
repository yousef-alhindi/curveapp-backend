import { Router } from "express";
import * as payment from '../../controllers/restaurant/payment';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 4 ****************
*****************************************/

router.route('/getOrderTransactionData').get(verifyRestaurantToken, payment.getOrderTransactionData);

router.route('/getPayoutHistory').get(verifyRestaurantToken, payment.getPayoutHistory);

router.route('/getPackageOrderTransactionData').get(verifyRestaurantToken, payment.getPackageOrderTransactionData);

router.route('/getPackagePayoutHistory').get(verifyRestaurantToken, payment.getPackagePayoutHistory);


export default router;
