import { Router } from "express";
import * as delivery from '../../controllers/restaurant/restDelivery';
import { verifyRestaurantToken } from "../../middlewares/authentication";
const router = Router();

/****************************************
*************** SPRINT 2 ****************
*****************************************/

router.route('/addEdit').post( verifyRestaurantToken, delivery.createEdit);
router.route('/list').get( verifyRestaurantToken, delivery.restDeliverylist);


export default router;
