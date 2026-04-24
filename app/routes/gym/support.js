import { Router } from "express";
import { verifyGymToken } from '../../middlewares/authentication';
import * as support from '../../controllers/gym/support';
const router = Router();

/****************************************
*************** SPRINT 8 ****************
*****************************************/

router.route('/').post(verifyGymToken, support.gymSupport);
router.route('/list').get(verifyGymToken, support.gymSupportlist);


export default router;
