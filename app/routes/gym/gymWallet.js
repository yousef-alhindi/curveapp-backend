import { Router } from 'express';
import * as wallet from '../../controllers/gym/gymWallet';
import { verifyGymToken } from '../../middlewares/authentication';
const router = Router();

/****************************************
 *************** SPRINT 7 ****************
 *****************************************/

router.route('/addBalance').post(verifyGymToken, wallet.addBalance);
router.route('/balance').get(verifyGymToken, wallet.getBalance);
router.route('/transaction/list').get(verifyGymToken, wallet.getTransactionsList);

export default router;
