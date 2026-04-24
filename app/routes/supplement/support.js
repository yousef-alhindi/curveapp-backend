import { Router } from "express";
import { verifySupplementToken } from "../../middlewares/authentication";
import * as support from '../../controllers/supplement/support';

const router = Router();

/****************************************
*************** SPRINT 7 ****************
*****************************************/

router.route('/').post(verifySupplementToken, support.supplementSupport);
router.route('/list').get(verifySupplementToken, support.supplementSupportlist);


export default router;
