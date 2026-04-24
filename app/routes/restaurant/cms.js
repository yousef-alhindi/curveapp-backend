import { Router } from "express";
import { verifyRestaurantToken } from "../../middlewares/authentication";
import * as auth from '../../controllers/restaurant/cms';
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/').get(verifyRestaurantToken, auth.restCms);
router.route('/faqList').get(verifyRestaurantToken, auth.restfaqList);


export default router;
