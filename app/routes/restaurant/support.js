import { Router } from "express";
import { verifyRestaurantToken } from "../../middlewares/authentication";
import * as support from '../../controllers/restaurant/support';
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/').post(verifyRestaurantToken, support.restSupport);
router.route('/list').get(verifyRestaurantToken, support.restSupportlist);


export default router;
