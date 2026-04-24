import { Router } from 'express';
import * as wallet from '../../controllers/supplement/supplementWallet';
import { verifySupplementToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 6 ****************
 *****************************************/

router.route('/addBalance').post(verifySupplementToken, wallet.addBalance);
router.route('/balance').get(verifySupplementToken, wallet.getBalance);
router.route('/transaction/list').get(verifySupplementToken, wallet.getTransactionsList);

export default router;
