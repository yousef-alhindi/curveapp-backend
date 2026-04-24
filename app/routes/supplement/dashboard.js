import { Router } from "express";
import * as dashboard from '../../controllers/supplement/dashboard';
import { verifySupplementToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 4 ****************
*****************************************/

router.route('/businuessStat').get(verifySupplementToken, dashboard.getBusinuessStats);
router.route('/dashBoardData').get(verifySupplementToken, dashboard.dashBoardData);
router.route('/deliveryOptionsUpdate').get(verifySupplementToken, dashboard.deliveryOptionsUpdate);

export default router;
