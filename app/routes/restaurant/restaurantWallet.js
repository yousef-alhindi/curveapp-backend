import { Router } from 'express';
import * as wallet from '../../controllers/restaurant/restaurantWallet';
import { verifyRestaurantToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router.route('/addBalance').post(verifyRestaurantToken, wallet.addBalance);
router.route('/balance').get(verifyRestaurantToken, wallet.getBalance);
router.route('/transaction/list').get(verifyRestaurantToken, wallet.getTransactionsList);

export default router;
