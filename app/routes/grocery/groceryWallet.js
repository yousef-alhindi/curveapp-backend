import { Router } from 'express';
import * as wallet from '../../controllers/grocery/groceryWallet';
import { verifyGroceryToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 9 ****************
 *****************************************/

router.route('/addBalance').post(verifyGroceryToken, wallet.addBalance);
router.route('/balance').get(verifyGroceryToken, wallet.getBalance);
router.route('/transaction/list').get(verifyGroceryToken, wallet.getTransactionsList);

export default router;
