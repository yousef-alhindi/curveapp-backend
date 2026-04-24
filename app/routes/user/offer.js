import { Router } from 'express';
import * as offer from '../../controllers/user/offer';
import { verifyUserToken } from '../../middlewares/authentication';

const router = Router();

/****************************************
 *************** SPRINT 2 ****************
 *****************************************/

router.route('/offerListInDetail').get(verifyUserToken, offer.offerListInDetail);

export default router;
