import { Router } from "express";
import * as dashboard from '../../controllers/restaurant/dashboard';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 4 ****************
*****************************************/

router.route('/businuessStat').get(verifyRestaurantToken, dashboard.getBusinuessStats);
router.route('/dashBoardData').get(verifyRestaurantToken, dashboard.dashBoardData);
router.route('/deliveryOptionsUpdate').get(verifyRestaurantToken, dashboard.deliveryOptionsUpdate);

router.route('/packagebusinuessStat').get(verifyRestaurantToken, dashboard.getPackageBusinuessStats);
router.route('/packagedashBoardData').get(verifyRestaurantToken, dashboard.packagedashBoardData);


export default router;
